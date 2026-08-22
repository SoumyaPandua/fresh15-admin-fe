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
import { useCodReport, type CodOrder } from "@/lib/payment-report-api";
import { inr, dateTime } from "@/lib/format";
import { Wallet, TrendingUp, TrendingDown, IndianRupee, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/payments/cod")({
  head: () => ({
    meta: [
      { title: "COD Reports — Fresh15 Admin" },
      { name: "description", content: "Cash on delivery collection reports." },
      { property: "og:title", content: "COD Reports — Fresh15 Admin" },
      { property: "og:description", content: "Cash on delivery collection reports." },
    ],
  }),
  component: CodReportPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const LIMIT = 20;

function CodReportPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isError, error, isFetching } = useCodReport({
    page, limit: LIMIT, search: search || undefined,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    from: from || undefined, to: to || undefined,
  });

  const summary = data?.summary;
  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const columns: Column<CodOrder>[] = [
    { key: "n", header: "Order", render: (o) => <span className="font-medium text-sm">{o.orderNumber || o.id}</span> },
    { key: "c", header: "Customer", render: (o) => <span className="text-sm">{o.customer?.name || "—"}</span> },
    { key: "amt", header: "Amount", accessor: (o) => o.amount, sortable: true, render: (o) => <span className="number text-sm font-semibold">{inr(o.amount || 0)}</span> },
    { key: "rider", header: "Partner", render: (o) => <span className="text-xs text-muted-foreground">{o.deliveryPartner?.name || "Unassigned"}</span> },
    { key: "when", header: "Placed", render: (o) => <span className="text-xs text-muted-foreground">{o.placedAt ? dateTime(o.placedAt) : "—"}</span> },
    { key: "s", header: "Payment", render: (o) => <StatusBadge label={(o.paymentStatus || "").toLowerCase() || "unknown"} tone={payStatusTone((o.paymentStatus || "").toLowerCase())} /> },
  ];

  const onFilter = (fn: () => void) => { fn(); setPage(1); };

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-9 w-44" placeholder="Search orders…" value={search}
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
      <PageHeader title="COD Reports" description="Cash collected from delivery partners." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="COD orders" value={String(summary?.codOrders ?? 0)} icon={Wallet} />
        <StatCard label="Collected" value={inr(summary?.collected ?? 0)} icon={TrendingUp} tone="success" />
        <StatCard label="Pending" value={inr(summary?.pending ?? 0)} icon={TrendingDown} tone="warning" />
        <StatCard label="Avg COD ticket" value={inr(Math.round(summary?.averageCodTicket ?? 0))} icon={IndianRupee} />
      </div>
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : isError ? (
        <EmptyState icon={Wallet} title="Unable to load COD report" description={errMsg(error, "Please try again.")} />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          filters={filters}
          pageSize={LIMIT}
          bulkActions={false}
          emptyTitle="No COD orders"
          emptyDescription="No cash on delivery orders match these filters."
        />
      )}
    </div>
  );
}
