"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, FilterChip, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AssignRiderDialog } from "@/components/admin/AssignRiderDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { inr, dateTime, relTime } from "@/lib/format";
import { getAdminOrders, statusLabel, apiPayStatusTone, apiOrderStatusTone, toList, type ApiOrder } from "@/lib/commerce";
import {
  useDeliveries, useDeliveryMutations, deliveryOrder, deliveryOrderId, deliveryRider,
  deliveryLabel, deliveryTone, canAssignRider, canAdminCancel, isDeliveryAdmin,
  orderEligibleForDelivery, DELIVERY_STATUSES, type ApiDelivery,
} from "@/lib/delivery-api";
import { useQuery } from "@tanstack/react-query";
import { Bike, MoreHorizontal, Plus, RefreshCw, ShieldAlert, Truck, UserPlus, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Fresh15 Admin" },
      { name: "description", content: "Track deliveries, assign riders and monitor fulfilment across Fresh15." },
      { property: "og:title", content: "Deliveries — Fresh15 Admin" },
      { property: "og:description", content: "Track deliveries, assign riders and monitor fulfilment across Fresh15." },
    ],
  }),
  component: DeliveriesPage,
});

const GROUPS = ["PENDING", "ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "REJECTED", "CANCELLED"] as const;

function DeliveriesPage() {
  const { user } = useAuth();
  const admin = isDeliveryAdmin(user?.role);
  const { data, isLoading, error, refetch, isFetching } = useDeliveries();
  const { status: statusMut, remove } = useDeliveryMutations();

  const [filter, setFilter] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<ApiDelivery | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ApiDelivery | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const deliveries = data ?? [];
  const filtered = filter ? deliveries.filter((d) => (d.status ?? "").toUpperCase() === filter) : deliveries;

  const count = (s: string) => deliveries.filter((d) => (d.status ?? "").toUpperCase() === s).length;
  const active = deliveries.filter((d) => ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes((d.status ?? "").toUpperCase())).length;

  if (!admin) {
    return (
      <EmptyState icon={ShieldAlert} title="Deliveries are admin-only"
        description="Your account doesn't have permission to manage deliveries." />
    );
  }

  const columns: Column<ApiDelivery>[] = [
    {
      key: "order", header: "Order", render: (d) => {
        const o = deliveryOrder(d);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{o?.orderNumber ?? deliveryOrderId(d).slice(-8).toUpperCase() ?? "—"}</span>
            <span className="text-xs text-muted-foreground">{d.createdAt ? relTime(d.createdAt) : "—"}</span>
          </div>
        );
      },
    },
    {
      key: "rider", header: "Rider", render: (d) => {
        const r = deliveryRider(d);
        if (!r) return <span className="text-xs text-muted-foreground">Unassigned</span>;
        return (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{r.name ?? "Partner"}</div>
            <div className="truncate text-xs text-muted-foreground">{r.phone ?? r.email ?? ""}</div>
          </div>
        );
      },
    },
    { key: "status", header: "Delivery", render: (d) => <StatusBadge label={deliveryLabel(d.status)} tone={deliveryTone(d.status) as any} /> },
    {
      key: "orderStatus", header: "Order status", render: (d) => {
        const o = deliveryOrder(d);
        return o?.orderStatus
          ? <StatusBadge label={statusLabel(o.orderStatus)} tone={apiOrderStatusTone(o.orderStatus) as any} />
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "payment", header: "Payment", render: (d) => {
        const o = deliveryOrder(d);
        return o?.paymentStatus
          ? <StatusBadge label={statusLabel(o.paymentStatus)} tone={apiPayStatusTone(o.paymentStatus) as any} />
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "charge", header: "Charge", accessor: (d) => d.deliveryCharge ?? 0, sortable: true,
      render: (d) => <span className="number text-sm">{d.deliveryCharge === undefined ? "—" : inr(d.deliveryCharge)}</span>,
    },
    {
      key: "earning", header: "Earning", accessor: (d) => d.earning ?? 0, sortable: true,
      render: (d) => <span className="number text-sm">{d.earning === undefined ? "—" : inr(d.earning)}</span>,
    },
    { key: "assignedAt", header: "Assigned", render: (d) => <span className="text-xs text-muted-foreground">{d.assignedAt ? dateTime(d.assignedAt) : "—"}</span> },
    { key: "updatedAt", header: "Updated", render: (d) => <span className="text-xs text-muted-foreground">{d.updatedAt ? relTime(d.updatedAt) : "—"}</span> },
    {
      key: "actions", header: "", className: "w-10 text-right", render: (d) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canAssignRider(d)} onClick={() => setAssignTarget(d)}>
                <UserPlus className="h-4 w-4" /> {deliveryRider(d) ? "Reassign rider" : "Assign rider"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={!canAdminCancel(d)}
                onClick={() => setCancelTarget(d)}
              >
                <XCircle className="h-4 w-4" /> Cancel delivery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        description="Live fulfilment records from the Fresh15 delivery service."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create delivery</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deliveries" value={String(deliveries.length)} icon={Bike} />
        <StatCard label="Awaiting rider" value={String(count("PENDING"))} icon={UserPlus} tone="warning" />
        <StatCard label="Active" value={String(active)} icon={Truck} tone="info" />
        <StatCard label="Delivered" value={String(count("DELIVERED"))} icon={Truck} tone="success" />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <EmptyState icon={Bike} title="Couldn't load deliveries" description={(error as Error).message}
          action={<Button size="sm" onClick={() => void refetch()}>Try again</Button>} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          pageSize={12}
          rowId={(d) => d._id}
          bulkActions={false}
          searchable={(d) => `${deliveryOrder(d)?.orderNumber ?? ""} ${deliveryRider(d)?.name ?? ""} ${deliveryRider(d)?.phone ?? ""} ${d.status ?? ""}`}
          emptyTitle="No deliveries yet"
          emptyDescription="Create a delivery for an eligible order to get started."
          filters={
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={filter === null} onClick={() => setFilter(null)}>All</FilterChip>
              {GROUPS.map((s) => (
                <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{deliveryLabel(s)}</FilterChip>
              ))}
            </div>
          }
        />
      )}

      <AssignRiderDialog delivery={assignTarget} open={!!assignTarget} onOpenChange={(v) => !v && setAssignTarget(null)} />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title="Cancel this delivery?"
        description="The rider will be released from this delivery. The order itself is not cancelled."
        confirmLabel="Cancel delivery"
        destructive
        onConfirm={() => {
          const t = cancelTarget;
          setCancelTarget(null);
          if (!t) return;
          statusMut.mutate({ id: t._id, status: "CANCELLED" }, {
            onSuccess: (res) => toast.success(res.message || "Delivery cancelled"),
            onError: (e: any) => toast.error(e.message),
          });
        }}
      />

      <CreateDeliveryDialog open={createOpen} onOpenChange={setCreateOpen} deliveries={deliveries} />

      {/* remove mutation kept available for backend-supported hard deletes */}
      <span className="hidden">{remove.isPending ? "…" : ""}</span>
    </div>
  );
}

function CreateDeliveryDialog({
  open, onOpenChange, deliveries,
}: { open: boolean; onOpenChange: (v: boolean) => void; deliveries: ApiDelivery[] }) {
  const { token } = useAuth();
  const { create } = useDeliveryMutations();
  const [orderId, setOrderId] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "for-delivery"],
    enabled: open && !!token,
    queryFn: async () => toList<ApiOrder>((await getAdminOrders({ limit: 200 }, token)).data),
  });

  const withDelivery = useMemo(() => new Set(deliveries.map(deliveryOrderId).filter(Boolean)), [deliveries]);
  const eligible = (orders ?? []).filter((o) => orderEligibleForDelivery(o.orderStatus) && !withDelivery.has(o._id));

  const submit = () => {
    if (!orderId || create.isPending) return;
    create.mutate(orderId, {
      onSuccess: (res) => {
        toast.success(res.message || "Delivery created");
        setOrderId("");
        onOpenChange(false);
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!create.isPending) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create delivery</DialogTitle>
          <DialogDescription>Only orders without an existing delivery are listed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Order</Label>
          <Select value={orderId} onValueChange={setOrderId}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading orders…" : eligible.length ? "Select an order" : "No eligible orders"} />
            </SelectTrigger>
            <SelectContent>
              {eligible.map((o) => (
                <SelectItem key={o._id} value={o._id}>
                  {(o.orderNumber ?? o._id.slice(-8).toUpperCase())} · {inr(o.grandTotal ?? 0)} · {statusLabel(o.orderStatus)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!orderId || create.isPending}>
            {create.isPending ? "Creating…" : "Create delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
