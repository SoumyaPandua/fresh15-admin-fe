"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, FilterChip, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { OrderDeliveryPanel } from "@/components/admin/OrderDeliveryPanel";
import { DeliveryCell } from "@/components/admin/DeliveryCell";
import { SubstitutionNote } from "@/components/admin/SubstitutionNote";
import { useAuth } from "@/lib/auth";
import {
  addressLine,
  apiOrderStatusTone,
  apiPayStatusTone,
  getAdminOrders,
  itemName,
  itemPrice,
  itemQty,
  itemSubstitution,
  nextStatuses,
  orderAddress,
  orderCustomer,
  orderGroup,
  statusLabel,
  toList,
  updateOrderStatus,
  type ApiOrder,
  type ApiOrderStatus,
  type OrderGroup,
} from "@/lib/commerce";
import { useRealtimeEvents } from "@/lib/realtime";
import { inr, dateTime, relTime } from "@/lib/format";
import { Package, MapPin, Truck, CheckCircle2, XCircle, RefreshCw, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — Fresh15 Admin" },
      { name: "description", content: "All orders across Fresh15 platform." },
      { property: "og:title", content: "Orders — Fresh15 Admin" },
      { property: "og:description", content: "All orders across Fresh15 platform." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  return <OrdersView title="All Orders" description="Every order placed across Fresh15." />;
}

export function OrdersView({ title, description, group }: { title: string; description: string; group?: OrderGroup }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderGroup | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getAdminOrders({ limit: 200 }, token);
        setOrders(toList<ApiOrder>(res.data));
        setError(null);
      } catch (e: any) {
        if (!silent) {
          setError(e.message);
          setOrders([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: new orders and status changes appear without a refresh.
  useRealtimeEvents(["order:new", "order:updated", "partner:assigned"], () => {
    void load(true);
  });

  const changeStatus = async (o: ApiOrder, next: ApiOrderStatus) => {
    try {
      const res = await updateOrderStatus(o._id, next, token);
      toast.success(res.message || `Order marked ${statusLabel(next)}`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const scoped = group ? orders.filter((o) => orderGroup(o.orderStatus) === group) : orders;
  const filtered = statusFilter ? scoped.filter((o) => orderGroup(o.orderStatus) === statusFilter) : scoped;
  const open = openId ? (orders.find((o) => o._id === openId) ?? null) : null;

  const columns: Column<ApiOrder>[] = [
    {
      key: "number",
      header: "Order",
      render: (o) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{o.orderNumber ?? o._id.slice(-8).toUpperCase()}</span>
          <span className="text-xs text-muted-foreground">{o.createdAt ? relTime(o.createdAt) : "—"}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => {
        const c = orderCustomer(o);
        const city = orderAddress(o)?.city ?? "";
        return c ? (
          <div className="flex items-center gap-2">
            {c.profileImage ? (
              <img src={c.profileImage} className="h-7 w-7 rounded-full object-cover" alt="" />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[11px] font-medium">
                {(c.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{c.name ?? "Customer"}</div>
              <div className="truncate text-xs text-muted-foreground">{city || c.phone || ""}</div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "items",
      header: "Items",
      render: (o) => {
        const flagged = (o.items ?? []).filter((it) => itemSubstitution(it)).length;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{o.items?.length ?? 0}</span>
            {flagged > 0 && (
              <span className="text-[11px] text-muted-foreground">{flagged} substitution pref.</span>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      accessor: (o) => o.grandTotal ?? 0,
      sortable: true,
      render: (o) => <span className="number text-sm font-semibold">{inr(o.grandTotal ?? 0)}</span>,
    },
    {
      key: "pay",
      header: "Payment",
      render: (o) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase">{o.paymentMethod ?? "—"}</span>
          <StatusBadge label={statusLabel(o.paymentStatus)} tone={apiPayStatusTone(o.paymentStatus) as any} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge label={statusLabel(o.orderStatus)} tone={apiOrderStatusTone(o.orderStatus) as any} />,
    },
    { key: "partner", header: "Delivery", render: (o) => <DeliveryCell orderId={o._id} /> },
    {
      key: "actions",
      header: "",
      className: "w-10 text-right",
      render: (o) => {
        const options = nextStatuses(o.orderStatus, o.paymentMethod, o.paymentStatus);
        if (!options.length) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Update <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {options.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => void changeStatus(o, s)}
                    className={s === "CANCELLED" ? "text-destructive focus:text-destructive" : ""}
                  >
                    Mark {statusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <EmptyState
          icon={Package}
          title="Couldn't load orders"
          description={error}
          action={
            <Button size="sm" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          pageSize={12}
          rowId={(o) => o._id}
          bulkActions={false}
          searchable={(o) => `${o.orderNumber ?? ""} ${orderCustomer(o)?.name ?? ""} ${orderAddress(o)?.city ?? ""}`}
          onRowClick={(o) => setOpenId(o._id)}
          emptyTitle="No orders yet"
          emptyDescription="Orders placed by customers will appear here."
          filters={
            group ? undefined : (
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={statusFilter === null} onClick={() => setStatusFilter(null)}>
                  All
                </FilterChip>
                {(["pending", "live", "completed", "cancelled"] as const).map((s) => (
                  <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </FilterChip>
                ))}
              </div>
            )
          }
        />
      )}

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {open && <OrderDetail order={open} onStatus={(s) => void changeStatus(open, s)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderDetail({ order, onStatus }: { order: ApiOrder; onStatus: (s: ApiOrderStatus) => void }) {
  const c = orderCustomer(order);
  const addr = orderAddress(order);
  const options = nextStatuses(order.orderStatus, order.paymentMethod, order.paymentStatus);
  const stepIcon = (label: string) =>
    /pending|placed/i.test(label)
      ? Package
      : /pickup|delivery|packing/i.test(label)
        ? Truck
        : /delivered/i.test(label)
          ? CheckCircle2
          : /cancel/i.test(label)
            ? XCircle
            : MapPin;

  const timeline = (order.statusHistory ?? []).map((h) => ({
    at: h.timestamp ?? h.updatedAt ?? order.createdAt ?? "",
    label: statusLabel(h.status),
  }));
  if (!timeline.length && order.createdAt) {
    timeline.push({ at: order.createdAt, label: statusLabel(order.orderStatus) });
  }

  return (
    <div className="space-y-6 py-2">
      <SheetHeader className="p-0">
        <div className="flex items-center gap-3">
          <SheetTitle className="text-xl">{order.orderNumber ?? order._id.slice(-8).toUpperCase()}</SheetTitle>
          <StatusBadge label={statusLabel(order.orderStatus)} tone={apiOrderStatusTone(order.orderStatus) as any} />
        </div>
        <SheetDescription>Placed {order.createdAt ? dateTime(order.createdAt) : "—"}</SheetDescription>
      </SheetHeader>

      {String(order.paymentMethod ?? "").toUpperCase() === "ONLINE" &&
        String(order.paymentStatus ?? "").toUpperCase() !== "PAID" &&
        order.orderStatus !== "CANCELLED" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <div className="font-semibold">Awaiting Razorpay payment</div>
            <div className="mt-1 text-xs text-muted-foreground">
              This order is reserved for up to 5 minutes. Fulfilment actions are locked until payment is confirmed.
            </div>
            {order.paymentExpiresAt && (
              <div className="mt-2 text-xs font-semibold">Payment deadline: {dateTime(order.paymentExpiresAt)}</div>
            )}
          </div>
        )}

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((s) => (
            <Button key={s} size="sm" variant={s === "CANCELLED" ? "outline" : "default"} onClick={() => onStatus(s)}>
              Mark {statusLabel(s)}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-xl border p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</div>
        {c ? (
          <div className="mt-2 flex items-center gap-3">
            {c.profileImage ? (
              <img src={c.profileImage} className="h-10 w-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-medium">
                {(c.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{c.name ?? "Customer"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {[c.phone, c.email].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-muted-foreground">Customer details unavailable.</div>
        )}
        <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
          <div className="font-medium text-foreground">Delivering to</div>
          <div className="text-muted-foreground">{addressLine(addr)}</div>
        </div>
      </div>

      <div className="rounded-xl border">
        <div className="border-b p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</div>
        <div className="divide-y">
          {(order.items ?? []).map((it, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{itemName(it)}</div>
                <div className="text-xs text-muted-foreground">
                  Qty {itemQty(it)} · {inr(itemPrice(it))} each
                </div>
                <SubstitutionNote item={it} />
              </div>
              <span className="number font-semibold">{inr(it.total ?? itemQty(it) * itemPrice(it))}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t p-4 text-sm">
          <Row k="Subtotal" v={inr(order.subtotal ?? 0)} />
          <Row k="Delivery" v={(order.deliveryCharge ?? 0) === 0 ? "Free" : inr(order.deliveryCharge ?? 0)} />
          {(order.discount ?? 0) > 0 && <Row k="Discount" v={`- ${inr(order.discount ?? 0)}`} />}
          <div className="mt-2 flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="number">{inr(order.grandTotal ?? 0)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Paid via {(order.paymentMethod ?? "—").toUpperCase()}</span>
            <StatusBadge label={statusLabel(order.paymentStatus)} tone={apiPayStatusTone(order.paymentStatus) as any} />
          </div>
        </div>
      </div>

      <OrderDeliveryPanel orderId={order._id} orderStatus={order.orderStatus} />

      <div className="rounded-xl border p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</div>
        <div className="mt-4 space-y-4">
          {timeline.map((t, i) => {
            const Icon = stepIcon(t.label);
            return (
              <div key={i} className="flex gap-3">
                <div className="relative">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="absolute left-1/2 top-8 h-6 w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="text-sm font-medium capitalize">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.at ? dateTime(t.at) : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{k}</span>
      <span className="number text-foreground">{v}</span>
    </div>
  );
}
