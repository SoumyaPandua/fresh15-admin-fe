"use client";

import { useState } from "react";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, FilterChip, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeBuoy, CheckCircle2, Clock, MoreHorizontal, CheckCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { dateTime, relTime } from "@/lib/format";
import { useSupportMutations, useSupportTicket, useSupportTickets, type SupportStatus, type SupportTicket } from "@/lib/support-api";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support Tickets — Fresh15 Admin" }] }),
  component: SupportPage,
});

const statuses: SupportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const tone = (status: SupportStatus) =>
  status === "OPEN" ? "warning" : status === "IN_PROGRESS" ? "info" : status === "RESOLVED" ? "success" : "neutral";

function SupportPage() {
  const [filter, setFilter] = useState<SupportStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const ticketsQuery = useSupportTickets();
  const ticketQuery = useSupportTicket(selectedId);
  const mutations = useSupportMutations();
  const tickets = ticketsQuery.data ?? [];
  const visible = filter ? tickets.filter((ticket) => ticket.status === filter) : tickets;

  const setStatus = async (id: string, status: SupportStatus) => {
    try {
      await mutations.status.mutateAsync({ id, value: status });
      toast.success(`Ticket marked ${status.toLowerCase().replace("_", " ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update ticket");
    }
  };

  const sendReply = async () => {
    const value = reply.trim();
    if (!value || !selectedId) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      await mutations.message.mutateAsync({ id: selectedId, value });
      setReply("");
      toast.success("Reply sent to customer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reply");
    }
  };

  const columns: Column<SupportTicket>[] = [
    { key: "ticket", header: "Ticket", render: (ticket) => (
      <div>
        <div className="text-sm font-medium">{ticket.subject}</div>
        <div className="text-xs text-muted-foreground">{ticket.ticketNumber}</div>
      </div>
    )},
    { key: "customer", header: "Customer", render: (ticket) => <span>{typeof ticket.userId === "object" ? ticket.userId?.name || ticket.userId?.email : ticket.userId || "—"}</span> },
    { key: "priority", header: "Priority", render: (ticket) => <StatusBadge label={ticket.priority} tone={ticket.priority === "URGENT" ? "danger" : ticket.priority === "HIGH" ? "warning" : ticket.priority === "MEDIUM" ? "info" : "neutral"} /> },
    { key: "when", header: "Opened", render: (ticket) => <span className="text-xs text-muted-foreground">{relTime(ticket.createdAt)}</span> },
    { key: "status", header: "Status", render: (ticket) => <StatusBadge label={ticket.status} tone={tone(ticket.status)} /> },
    { key: "actions", header: "", className: "w-10 text-right", render: (ticket) => (
      <div onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedId(ticket._id)}><MessageSquare className="h-4 w-4" /> Reply</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void setStatus(ticket._id, "RESOLVED")}><CheckCheck className="h-4 w-4" /> Mark resolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void setStatus(ticket._id, "CLOSED")}>Close ticket</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )},
  ];

  const selected = ticketQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" description="Live customer support inbox." />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Open" value={String(tickets.filter((ticket) => ticket.status === "OPEN").length)} icon={LifeBuoy} tone="warning" />
        <StatCard label="In progress" value={String(tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length)} icon={Clock} tone="info" />
        <StatCard label="Resolved" value={String(tickets.filter((ticket) => ticket.status === "RESOLVED").length)} icon={CheckCircle2} tone="success" />
        <StatCard label="Closed" value={String(tickets.filter((ticket) => ticket.status === "CLOSED").length)} icon={CheckCircle2} />
      </div>

      <DataTable
        data={visible}
        columns={columns}
        onRowClick={(ticket) => setSelectedId(ticket._id)}
        searchable={(ticket) => `${ticket.subject} ${ticket.ticketNumber} ${typeof ticket.userId === "object" ? ticket.userId?.name || "" : ticket.userId || ""}`}
        pageSize={12}
        filters={
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={!filter} onClick={() => setFilter(null)}>All</FilterChip>
            {statuses.map((status) => <FilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>{status.toLowerCase().replace("_", " ")}</FilterChip>)}
          </div>
        }
      />

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) { setSelectedId(null); setReply(""); } }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <div className="space-y-5 py-2">
              <SheetHeader className="p-0">
                <SheetTitle>{selected.subject}</SheetTitle>
                <SheetDescription>{selected.ticketNumber} · Opened {dateTime(selected.createdAt)}</SheetDescription>
              </SheetHeader>

              <div className="rounded-xl border p-4 text-sm">
                <div className="font-semibold">{typeof selected.userId === "object" ? selected.userId?.name || selected.userId?.email : "Customer"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{selected.description}</div>
                <div className="mt-2"><StatusBadge label={selected.status} tone={tone(selected.status)} /></div>
              </div>

              <div className="space-y-3">
                {(selected.messages ?? []).map((message) => (
                  <div key={message._id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{message.senderId?.name || message.senderRole}</span>
                      <span>{dateTime(message.createdAt)}</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{message.message}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write your response..." />
                <div className="flex gap-2">
                  <Button onClick={() => void sendReply()} disabled={mutations.message.isPending}><MessageSquare className="h-4 w-4" /> Send reply</Button>
                  <Button variant="outline" onClick={() => { void setStatus(selected._id, "RESOLVED"); setSelectedId(null); }} disabled={mutations.status.isPending}><CheckCheck className="h-4 w-4" /> Resolve</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
