"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BellRing,
  Mail,
  Package,
  RefreshCw,
  Tag,
  Users,
} from "lucide-react";
import {
  useAdminProductAlertSummary,
  useAdminProductAlerts,
  type ApiProductAlert,
} from "@/lib/product-alert-api";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/product-alerts")({
  head: () => ({
    meta: [
      { title: "Product Alerts — Fresh15 Admin" },
      {
        name: "description",
        content: "Monitor customer demand for back-in-stock and price-drop alerts.",
      },
    ],
  }),
  component: ProductAlertsPage,
});

const productOf = (alert: ApiProductAlert) =>
  typeof alert.productId === "object" && alert.productId
    ? alert.productId
    : null;

const userOf = (alert: ApiProductAlert) =>
  typeof alert.userId === "object" && alert.userId
    ? alert.userId
    : null;

function ProductAlertsPage() {
  const summary = useAdminProductAlertSummary();
  const alerts = useAdminProductAlerts({ limit: 200 });

  const rows = alerts.data ?? [];

  const columns: Column<ApiProductAlert>[] = [
    {
      key: "product",
      header: "Product",
      render: (alert) => {
        const product = productOf(alert);

        return (
          <div className="flex items-center gap-3">
            {product?.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name ?? ""}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {product?.name ?? "Product"}
              </div>
              <div className="text-xs text-muted-foreground">
                {product?.sku ?? "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "customer",
      header: "Customer",
      render: (alert) => {
        const user = userOf(alert);

        return (
          <div>
            <div className="text-sm font-medium">
              {user?.name ?? "Customer"}
            </div>
            <div className="text-xs text-muted-foreground">
              {user?.email ?? "—"}
            </div>
          </div>
        );
      },
    },
    {
      key: "alerts",
      header: "Alerts",
      render: (alert) => (
        <div className="flex flex-wrap gap-1.5">
          {alert.backInStock && (
            <Badge
              variant="secondary"
              className="gap-1 bg-primary/10 text-primary"
            >
              <BellRing className="h-3 w-3" />
              Restock
            </Badge>
          )}

          {alert.priceDrop && (
            <Badge
              variant="secondary"
              className="gap-1 bg-success/10 text-success"
            >
              <Tag className="h-3 w-3" />
              Price
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (alert) =>
        alert.targetPrice != null
          ? inr(alert.targetPrice)
          : "Any meaningful drop",
    },
    {
      key: "channels",
      header: "Channels",
      render: (alert) => (
        <div className="flex gap-1">
          {alert.inAppEnabled !== false && (
            <Badge variant="outline">In-app</Badge>
          )}
          {alert.emailEnabled && (
            <Badge variant="outline" className="gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (alert) =>
        alert.updatedAt
          ? new Date(alert.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Alerts"
        description="See which products customers are waiting for and which price drops they care about."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void summary.refetch();
              void alerts.refetch();
            }}
            disabled={summary.isFetching || alerts.isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {summary.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <LoadingSkeleton rows={1} />
          <LoadingSkeleton rows={1} />
          <LoadingSkeleton rows={1} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active subscriptions"
            value={String(summary.data?.total ?? 0)}
            icon={Users}
          />
          <StatCard
            label="Waiting for restock"
            value={String(summary.data?.backInStock ?? 0)}
            icon={BellRing}
            tone="warning"
          />
          <StatCard
            label="Watching price"
            value={String(summary.data?.priceDrop ?? 0)}
            icon={Tag}
            tone="success"
          />
        </div>
      )}

      {summary.data?.topProducts?.length ? (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                Most-watched products
              </div>
              <div className="text-xs text-muted-foreground">
                Useful demand signals for pricing and replenishment.
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.data.topProducts.map((product) => (
              <div
                key={product.productId}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name ?? ""}
                    className="h-11 w-11 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-muted">
                    <Package className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">
                    {product.name ?? "Product"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {product.subscribers} subscribers ·{" "}
                    {inr(Number(product.sellingPrice ?? 0))}
                  </div>
                </div>

                {Number(product.stock ?? 0) <= 0 && (
                  <Badge variant="destructive">OOS</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {alerts.isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : alerts.isError ? (
        <EmptyState
          icon={BellRing}
          title="Couldn't load product alerts"
          description={
            alerts.error instanceof Error
              ? alerts.error.message
              : "Please try again."
          }
          action={
            <Button size="sm" onClick={() => void alerts.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          pageSize={12}
          rowId={(alert) => alert._id}
          searchable={(alert) => {
            const product = productOf(alert);
            const user = userOf(alert);
            return `${product?.name ?? ""} ${product?.sku ?? ""} ${user?.name ?? ""} ${user?.email ?? ""}`;
          }}
          emptyTitle="No product alerts yet"
          emptyDescription="Customer subscriptions will appear here."
        />
      )}
    </div>
  );
}
