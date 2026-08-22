"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { ORDERS, customerById, type Order } from "@/lib/mock-data";
import { inr, relTime } from "@/lib/format";
import { RefreshCcw, TrendingDown, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payments/refunds")({
  head: () => ({ meta: [{ title: "Refund Center — Fresh15 Admin" }, { name: "description", content: "Manage refunds and disputes." }] }),
  component: () => {
    const refunded = ORDERS.filter(o => o.payStatus === "refunded");
    const pending = refunded.slice(0, 6);
    const total = refunded.reduce((s, o) => s + o.total, 0);
    const columns: Column<Order>[] = [
      { key: "n", header: "Order", render: (o) => <span className="font-medium text-sm">{o.number}</span> },
      { key: "c", header: "Customer", render: (o) => <span className="text-sm">{customerById(o.customerId)?.name}</span> },
      { key: "reason", header: "Reason", render: () => <span className="text-sm text-muted-foreground">Order cancelled</span> },
      { key: "amt", header: "Amount", accessor: (o) => o.total, sortable: true, render: (o) => <span className="number text-sm font-semibold">{inr(o.total)}</span> },
      { key: "when", header: "Requested", render: (o) => <span className="text-xs text-muted-foreground">{relTime(o.createdAt)}</span> },
      { key: "s", header: "Status", render: () => <StatusBadge label="processing" tone="warning" /> },
      { key: "act", header: "", className: "text-right", render: (o) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toast.success(`Refund approved for ${o.number}`); }}>Approve</Button>
      )},
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Refund Center" description="Approve, reject and track customer refunds." />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total refunded (30d)" value={inr(total)} delta={-3.1} icon={TrendingDown} tone="warning" />
          <StatCard label="Pending approval" value={String(pending.length)} icon={Clock} tone="info" />
          <StatCard label="Auto-refunded" value={String(refunded.length - pending.length)} icon={RefreshCcw} />
        </div>
        <DataTable data={refunded} columns={columns} searchable={(o) => o.number} pageSize={10} />
      </div>
    );
  },
});
