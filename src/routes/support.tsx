"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, FilterChip, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TICKETS as SEED, type Ticket } from "@/lib/mock-data";
import { relTime, dateTime } from "@/lib/format";
import { LifeBuoy, CheckCircle2, Clock, Plus, MoreHorizontal, CheckCheck, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support Tickets — Fresh15 Admin" }, { name: "description", content: "Customer support inbox and ticket resolution." }] }),
  component: SupportPage,
});

function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(SEED);
  const [filter, setFilter] = useState<string | null>(null);
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [draft, setDraft] = useState<Partial<Ticket>>({ subject: "", customer: "", priority: "medium", status: "open" });

  const data = filter ? tickets.filter(t => t.status === filter) : tickets;

  const priorityTone = (p: string) => p === "urgent" ? "danger" : p === "high" ? "warning" : p === "medium" ? "info" : "neutral";
  const statusTone = (s: string) => s === "open" ? "warning" : s === "pending" ? "info" : s === "resolved" ? "success" : "neutral";

  const setStatus = (t: Ticket, status: Ticket["status"]) => {
    setTickets(list => list.map(x => x.id === t.id ? { ...x, status } : x));
    toast.success(`Ticket marked ${status}`);
  };
  const sendReply = () => {
    if (!reply.trim()) { toast.error("Reply cannot be empty"); return; }
    toast.success("Reply sent to customer");
    setReply("");
    if (openTicket) setStatus(openTicket, "pending");
  };
  const createTicket = () => {
    if (!draft.subject || !draft.customer) { toast.error("Subject and customer required"); return; }
    const t: Ticket = {
      id: `tkt_${Date.now()}`, subject: draft.subject!, customer: draft.customer!,
      priority: (draft.priority as any) || "medium", status: (draft.status as any) || "open",
      createdAt: new Date().toISOString(),
    };
    setTickets(list => [t, ...list]);
    toast.success("Ticket created");
    setOpenNew(false); setDraft({ subject: "", customer: "", priority: "medium", status: "open" });
  };

  const columns: Column<Ticket>[] = [
    { key: "subj", header: "Ticket", render: (t) => (
      <div>
        <div className="text-sm font-medium">{t.subject}</div>
        <div className="text-xs text-muted-foreground">{t.id} {t.orderId && `· ${t.orderId}`}</div>
      </div>
    )},
    { key: "cust", header: "Customer", render: (t) => <span className="text-sm">{t.customer}</span> },
    { key: "pri", header: "Priority", render: (t) => <StatusBadge label={t.priority} tone={priorityTone(t.priority) as any} /> },
    { key: "when", header: "Opened", render: (t) => <span className="text-xs text-muted-foreground">{relTime(t.createdAt)}</span> },
    { key: "stat", header: "Status", render: (t) => <StatusBadge label={t.status} tone={statusTone(t.status) as any} /> },
    { key: "a", header: "", className: "w-10 text-right", render: (t) => (
      <div onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpenTicket(t)}><MessageSquare className="h-4 w-4" /> Reply</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(t, "resolved")}><CheckCheck className="h-4 w-4" /> Mark resolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(t, "closed")}>Close ticket</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" description="Customer support inbox."
        actions={<Button size="sm" onClick={() => setOpenNew(true)}><Plus className="h-4 w-4" /> New ticket</Button>} />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Open" value={String(tickets.filter(t => t.status === "open").length)} icon={LifeBuoy} tone="warning" />
        <StatCard label="Pending" value={String(tickets.filter(t => t.status === "pending").length)} icon={Clock} tone="info" />
        <StatCard label="Resolved" value={String(tickets.filter(t => t.status === "resolved").length)} icon={CheckCircle2} tone="success" />
        <StatCard label="Avg response" value="1h 24m" delta={-8.4} icon={Clock} />
      </div>
      <DataTable data={data} columns={columns} onRowClick={(t) => setOpenTicket(t)}
        searchable={(t) => `${t.subject} ${t.customer}`} pageSize={12}
        filters={
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === null} onClick={() => setFilter(null)}>All</FilterChip>
            {(["open","pending","resolved","closed"] as const).map(s => (
              <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>
            ))}
          </div>
        }
      />

      <Sheet open={!!openTicket} onOpenChange={(v) => { if (!v) { setOpenTicket(null); setReply(""); } }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {openTicket && (
            <div className="space-y-5 py-2">
              <SheetHeader className="p-0">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-lg">{openTicket.subject}</SheetTitle>
                  <StatusBadge label={openTicket.status} tone={statusTone(openTicket.status) as any} />
                </div>
                <SheetDescription>{openTicket.id} · Opened {dateTime(openTicket.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="rounded-xl border p-4 text-sm">
                <div className="text-xs uppercase text-muted-foreground">Customer</div>
                <div className="mt-1 font-medium">{openTicket.customer}</div>
                {openTicket.orderId && <div className="mt-1 text-xs text-muted-foreground">Related order: {openTicket.orderId}</div>}
              </div>
              <div className="space-y-2">
                <Label>Reply</Label>
                <Textarea rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Write your response..." />
                <div className="flex gap-2">
                  <Button onClick={sendReply}><MessageSquare className="h-4 w-4" /> Send reply</Button>
                  <Button variant="outline" onClick={() => { setStatus(openTicket, "resolved"); setOpenTicket(null); }}>
                    <CheckCheck className="h-4 w-4" /> Resolve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New ticket</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Subject</Label><Input value={draft.subject ?? ""} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Customer name</Label><Input value={draft.customer ?? ""} onChange={e => setDraft(d => ({ ...d, customer: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={draft.priority} onValueChange={v => setDraft(d => ({ ...d, priority: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low","medium","high","urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button><Button onClick={createTicket}>Create ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
