"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  useAdminRefunds,
  useProcessRefund,
  useRejectRefund,
  useCompleteManualRefund,
  type AdminRefund,
} from "@/lib/refund-api";
import { inr, relTime } from "@/lib/format";
import {
  RefreshCcw,
  TrendingDown,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/payments/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Center — Fresh15 Admin" },
      {
        name: "description",
        content: "Manage refunds and disputes.",
      },
    ],
  }),
  component: RefundCenter,
});

function RefundCenter() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useAdminRefunds({
    page: 1,
    limit: 100,
    search,
  });

  const processRefund = useProcessRefund();
  const rejectRefund = useRejectRefund();
  const completeManual = useCompleteManualRefund();

  const items = data?.items ?? [];
  const summary = data?.summary ?? {};

  const getSummary = (upper: string, lower: string) =>
    summary[upper] ?? summary[lower] ?? { count: 0, amount: 0 };

  const processedSummary = getSummary("PROCESSED", "processed");
  const requestedSummary = getSummary("REQUESTED", "requested");
  const approvedSummary = getSummary("APPROVED", "approved");
  const processingSummary = getSummary("PROCESSING", "processing");
  const totalProcessed = processedSummary.amount;
  const pendingCount =
    requestedSummary.count + approvedSummary.count + processingSummary.count;

  const columns: Column<AdminRefund>[] = [
    {
      key: "n",
      header: "Order",
      render: (refund) => (
        <span className="font-medium text-sm">
          {refund.orderId?.orderNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "c",
      header: "Customer",
      render: (refund) => (
        <span className="text-sm">
          {refund.userId?.name ?? refund.userId?.email ?? "—"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (refund) => (
        <span className="text-sm text-muted-foreground">
          {refund.reason}
        </span>
      ),
    },
    {
      key: "amt",
      header: "Amount",
      accessor: (refund) => refund.amount,
      sortable: true,
      render: (refund) => (
        <span className="number text-sm font-semibold">
          {inr(refund.amount)}
        </span>
      ),
    },
    {
      key: "when",
      header: "Requested",
      render: (refund) => (
        <span className="text-xs text-muted-foreground">
          {relTime(refund.createdAt)}
        </span>
      ),
    },
    {
      key: "s",
      header: "Status",
      render: (refund) => (
        <StatusBadge
          label={refund.status.toLowerCase().replaceAll("_", " ")}
          tone={
            refund.status === "PROCESSED"
              ? "success"
              : refund.status === "FAILED" || refund.status === "REJECTED"
                ? "danger"
                : "warning"
          }
        />
      ),
    },
    {
      key: "act",
      header: "",
      className: "text-right",
      render: (refund) => {
        if (refund.status === "REQUESTED" || refund.status === "APPROVED") {
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={rejectRefund.isPending}
                onClick={async (event) => {
                  event.stopPropagation();
                  const reason = window.prompt("Reason for rejecting this refund:");
                  if (!reason?.trim()) return;
                  try {
                    await rejectRefund.mutateAsync({ refundId: refund._id, reason: reason.trim() });
                    toast.success("Refund rejected");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not reject refund");
                  }
                }}
              >
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={processRefund.isPending}
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    await processRefund.mutateAsync(refund._id);
                    toast.success(`Refund processing started for ${refund.orderId?.orderNumber ?? "order"}`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not process refund");
                  }
                }}
              >
                {processRefund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
              </Button>
            </div>
          );
        }

        if (refund.status === "FAILED") {
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={processRefund.isPending}
              onClick={async (event) => {
                event.stopPropagation();
                try {
                  await processRefund.mutateAsync(refund._id);
                  toast.success("Refund retry started");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not retry refund");
                }
              }}
            >
              {processRefund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry"}
            </Button>
          );
        }

        if (refund.status === "MANUAL_REQUIRED") {
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={completeManual.isPending}
              onClick={async (event) => {
                event.stopPropagation();
                const reference = window.prompt(
                  "Enter manual refund reference:",
                );
                if (!reference?.trim()) return;

                try {
                  await completeManual.mutateAsync({
                    refundId: refund._id,
                    reference: reference.trim(),
                  });
                  toast.success("Manual refund completed");
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Could not complete manual refund",
                  );
                }
              }}
            >
              Complete
            </Button>
          );
        }

        return null;
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Refund Center"
          description="Approve, reject and track customer refunds."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[104px] animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Refund Center"
          description="Approve, reject and track customer refunds."
        />
        <div className="rounded-xl border p-5 text-sm">
          Unable to load refunds.{" "}
          {error instanceof Error ? error.message : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund Center"
        description="Approve, reject and track customer refunds."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total refunded (30d)"
          value={inr(totalProcessed)}
          delta={-3.1}
          icon={TrendingDown}
          tone="warning"
        />
        <StatCard
          label="Pending approval"
          value={String(pendingCount)}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Processed"
          value={String(processedSummary.count)}
          icon={RefreshCcw}
        />
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchable={(refund) =>
          `${refund.orderId?.orderNumber ?? ""} ${refund.userId?.name ?? ""} ${refund.reason}`
        }
        pageSize={10}
      />
    </div>
  );
}
