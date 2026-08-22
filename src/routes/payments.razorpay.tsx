"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge, payStatusTone } from "@/components/admin/StatusBadge";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRazorpayReport, type RazorpayOrder } from "@/lib/payment-report-api";
import { inr, dateTime } from "@/lib/format";
import { IndianRupee, TrendingUp, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/payments/razorpay")({
  head: () => ({
    meta: [
      { title: "Razorpay Reports — Fresh15 Admin" },
      { name: "description", content: "Razorpay settlement and transaction reports." },
      { property: "og:title", content: "Razorpay Reports — Fresh15 Admin" },
      { property: "og:description", content: "Razorpay settlement and transaction reports." },
    ],
  }),
  component: RazorpayReportPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const LIMIT = 20;

function RazorpayReportPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isError, error, isFetching } = useRazorpayReport({
    page, limit: LIMIT, search: search || undefined,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    from: from || undefined, to: to || undefined,
  });

  const summary = data?.summary;
  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const columns: Column<RazorpayOrder>[] = [
    { key: "txn", header: "Txn ID", render: (o) => <span className="font-mono text-xs">{o.razorpayPaymentId || o.razorpayOrderId || "—"}</span> },
    { key: "n", header: "Order", render: (o) => <span className="font-medium text-sm">{o.orderNumber || o.id}</span> },
    { key: "c", header: "Customer", render: (o) => <span className="text-sm">{o.customer?.name || "—"}</span> },
    { key: "amt", header: "Amount", accessor: (o) => o.amount, sortable: true, render: (o) => <span className="number text-sm font-semibold">{inr(o.amount || 0)}</span> },
    { key: "gw", header: "Gateway", render: (o) => <span className="text-xs text-muted-foreground">{o.gatewayStatus || "—"}</span> },
    { key: "when", header: "Captured", render: (o) => <span className="text-xs text-muted-foreground">{o.createdAt ? dateTime(o.createdAt) : "—"}</span> },
    { key: "s", header: "Status", render: (o) => <StatusBadge label={(o.paymentStatus || "").toLowerCase() || "unknown"} tone={payStatusTone((o.paymentStatus || "").toLowerCase())} /> },
  ];

  const onFilter = (fn: () => void) => { fn(); setPage(1); };

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-9 w-44" placeholder="Search transactions…" value={search}
        onChange={(e) => onFilter(() => setSearch(e.target.value))} />
      <Select value={paymentStatus} onValueChange={(v) => onFilter(() => setPaymentStatus(v))}>
        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Payment" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All payments</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" className="h-9 w-36" value={from} onChange={(e) => onFilter(() => setFrom(e.target.value))} />
      <Input type="date" className="h-9 w-36" value={to} onChange={(e) => onFilter(() => setTo(e.target.value))} />
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {pagination.page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Razorpay Reports" description="Online payment settlements." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Transactions" value={String(summary?.totalTransactions ?? 0)} icon={IndianRupee} tone="info" />
        <StatCard label="Successful" value={inr(summary?.successful ?? 0)} icon={TrendingUp} tone="success" />
        <StatCard label="Pending" value={inr(summary?.pending ?? 0)} icon={Percent} tone="warning" />
        <StatCard label="Failed" value={inr(summary?.failed ?? 0)} icon={Percent} tone="danger" />
        <StatCard label="Total amount" value={inr(summary?.totalAmount ?? 0)} icon={TrendingUp} />
        <StatCard label="Avg transaction" value={inr(Math.round(summary?.averageTransaction ?? 0))} icon={IndianRupee} />
      </div>
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : isError ? (
        <EmptyState icon={IndianRupee} title="Unable to load Razorpay report" description={errMsg(error, "Please try again.")} />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          filters={filters}
          pageSize={LIMIT}
          bulkActions={false}
          emptyTitle="No transactions"
          emptyDescription="No Razorpay transactions match these filters."
        />
      )}
    </div>
  );
}
