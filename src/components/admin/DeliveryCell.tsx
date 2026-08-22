import { StatusBadge } from "@/components/admin/StatusBadge";
import { useDeliveries, deliveryOrderId, deliveryRider, deliveryLabel, deliveryTone } from "@/lib/delivery-api";

/** Compact delivery/rider summary for the orders table. */
export function DeliveryCell({ orderId }: { orderId: string }) {
  const { data } = useDeliveries();
  const d = (data ?? []).find((x) => deliveryOrderId(x) === orderId);
  if (!d) return <span className="text-xs text-muted-foreground">No delivery</span>;
  const rider = deliveryRider(d);
  return (
    <div className="flex flex-col gap-1">
      <StatusBadge label={deliveryLabel(d.status)} tone={deliveryTone(d.status) as any} />
      <span className="truncate text-xs text-muted-foreground">{rider?.name ?? "Unassigned"}</span>
    </div>
  );
}
