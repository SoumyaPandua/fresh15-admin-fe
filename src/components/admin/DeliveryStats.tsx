import { StatCard } from "@/components/admin/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useDeliveries, isDeliveryAdmin } from "@/lib/delivery-api";
import { Bike, Truck, UserPlus, CheckCircle2 } from "lucide-react";

const ACTIVE = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"];

/** Real delivery KPIs from /api/delivery — rendered only for admins. */
export function DeliveryStats() {
  const { user } = useAuth();
  const admin = isDeliveryAdmin(user?.role);
  const { data, isLoading, error } = useDeliveries();

  if (!admin || error) return null;
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] w-full rounded-xl" />)}
      </div>
    );
  }

  const list = data ?? [];
  const s = (x: { status?: string }) => (x.status ?? "").toUpperCase();
  const today = new Date().toDateString();
  const deliveredToday = list.filter(
    (d) => s(d) === "DELIVERED" && d.deliveredAt && new Date(d.deliveredAt).toDateString() === today,
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Active deliveries" value={String(list.filter((d) => ACTIVE.includes(s(d))).length)} icon={Bike} tone="info" hint="in progress" />
      <StatCard label="Awaiting rider" value={String(list.filter((d) => s(d) === "PENDING").length)} icon={UserPlus} tone="warning" hint="unassigned" />
      <StatCard label="Out for delivery" value={String(list.filter((d) => s(d) === "OUT_FOR_DELIVERY").length)} icon={Truck} hint="right now" />
      <StatCard label="Delivered today" value={String(deliveredToday)} icon={CheckCircle2} tone="success" hint="completed" />
    </div>
  );
}
