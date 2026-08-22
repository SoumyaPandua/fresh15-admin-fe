"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/format";
import {
  useDeliveries, deliveryRider, deliveryLabel, deliveryTone, isDeliveryAdmin,
  type DeliveryRider,
} from "@/lib/delivery-api";
import { isPartnerRider } from "@/components/admin/AssignRiderDialog";
import { useRealtime } from "@/lib/realtime";
import { Bike, RefreshCw, ShieldAlert, Truck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/delivery-partners")({
  head: () => ({
    meta: [
      { title: "Delivery Partners — Fresh15 Admin" },
      { name: "description", content: "Fresh15 delivery partners and their live assignments." },
      { property: "og:title", content: "Delivery Partners — Fresh15 Admin" },
      { property: "og:description", content: "Fresh15 delivery partners and their live assignments." },
    ],
  }),
  component: PartnersPage,
});

const ACTIVE = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"];

type PartnerRow = {
  rider: DeliveryRider;
  current: { status?: string; orderLabel: string } | null;
  completed: number;
  earnings: number;
};

function PartnersPage() {
  const { user } = useAuth();
  const admin = isDeliveryAdmin(user?.role);
  const { data, isLoading, error, refetch, isFetching } = useDeliveries();
  const { presence } = useRealtime();

  if (!admin) {
    return <EmptyState icon={ShieldAlert} title="Partners are admin-only" description="Your account doesn't have permission to view delivery partners." />;
  }

  const deliveries = data ?? [];
  const map = new Map<string, PartnerRow>();
  deliveries.forEach((d) => {
    const r = deliveryRider(d);
    if (!isPartnerRider(r)) return;
    const id = r!._id!;
    const row = map.get(id) ?? { rider: r!, current: null, completed: 0, earnings: 0 };
    const status = (d.status ?? "").toUpperCase();
    if (status === "DELIVERED") {
      row.completed += 1;
      row.earnings += d.earning ?? 0;
    }
    if (ACTIVE.includes(status) && !row.current) {
      const o = typeof d.orderId === "object" ? d.orderId : null;
      row.current = { status, orderLabel: o?.orderNumber ?? "" };
    }
    map.set(id, row);
  });
  const rows = [...map.values()].sort((a, b) => (a.rider.name ?? "").localeCompare(b.rider.name ?? ""));
  const onDelivery = rows.filter((r) => r.current).length;
  const totalCompleted = rows.reduce((s, r) => s + r.completed, 0);

  const columns: Column<PartnerRow>[] = [
    {
      key: "name", header: "Partner", render: (p) => (
        <div className="flex items-center gap-2.5">
          {p.rider.profileImage
            ? <img src={p.rider.profileImage} className="h-9 w-9 rounded-full object-cover" alt="" />
            : <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-medium">{(p.rider.name ?? "?").slice(0, 1).toUpperCase()}</div>}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{p.rider.name ?? "Partner"}</div>
            <div className="truncate text-xs text-muted-foreground">{p.rider.phone ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (p) => <span className="text-sm">{p.rider.email ?? "—"}</span> },
    {
      key: "presence", header: "Availability", render: (p) => {
        const pr = presence[p.rider._id!];
        return pr
          ? <StatusBadge label={pr.online ? "online" : "offline"} tone={pr.online ? "success" : "neutral"} />
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "account", header: "Account", render: (p) => p.rider.isActive === undefined
        ? <span className="text-xs text-muted-foreground">—</span>
        : <StatusBadge label={p.rider.isActive ? "active" : "inactive"} tone={p.rider.isActive ? "success" : "neutral"} />,
    },
    {
      key: "current", header: "Current delivery", render: (p) => p.current
        ? (
          <div className="flex flex-col gap-1">
            <StatusBadge label={deliveryLabel(p.current.status)} tone={deliveryTone(p.current.status) as any} />
            {p.current.orderLabel && <span className="text-xs text-muted-foreground">{p.current.orderLabel}</span>}
          </div>
        )
        : <span className="text-xs text-muted-foreground">Idle</span>,
    },
    { key: "completed", header: "Completed", accessor: (p) => p.completed, sortable: true, render: (p) => <span className="number text-sm">{p.completed}</span> },
    { key: "earnings", header: "Earnings", accessor: (p) => p.earnings, sortable: true, render: (p) => <span className="number text-sm">{inr(p.earnings)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Partners"
        description="Partner riders seen on Fresh15 delivery records."
        actions={<Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Partners with deliveries" value={String(rows.length)} icon={Bike} />
        <StatCard label="Currently on delivery" value={String(onDelivery)} icon={Truck} tone="info" />
        <StatCard label="Completed deliveries" value={String(totalCompleted)} icon={CheckCircle2} tone="success" />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <EmptyState icon={Bike} title="Couldn't load partners" description={(error as Error).message}
          action={<Button size="sm" onClick={() => void refetch()}>Try again</Button>} />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          pageSize={10}
          bulkActions={false}
          rowId={(p) => p.rider._id!}
          searchable={(p) => `${p.rider.name ?? ""} ${p.rider.phone ?? ""} ${p.rider.email ?? ""}`}
          emptyTitle="No partner riders yet"
          emptyDescription="Partners appear here once they are assigned to deliveries. A partner directory endpoint isn't available on the backend yet."
        />
      )}

      <p className="text-xs text-muted-foreground">
        Completed counts and earnings are derived from real delivery records. Availability updates live from partner status events.
      </p>
    </div>
  );
}
