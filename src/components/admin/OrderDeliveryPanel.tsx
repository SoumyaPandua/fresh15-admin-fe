import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AssignRiderDialog } from "@/components/admin/AssignRiderDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { dateTime } from "@/lib/format";
import {
  useDeliveries,
  useDeliveryMutations,
  deliveryOrderId,
  deliveryRider,
  deliveryLabel,
  deliveryTone,
  deliveryStateText,
  canAssignRider,
  isDeliveryAdmin,
  orderEligibleForDelivery,
} from "@/lib/delivery-api";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/lib/realtime";
import { getSocket } from "@/lib/socket";
import { UserPlus, ShieldCheck, Camera, PenLine, AlertTriangle } from "lucide-react";
import { LiveDeliveryMap } from "@/components/admin/LiveDeliveryMap";

/** Delivery block rendered inside the Order detail drawer. */
export function OrderDeliveryPanel({ orderId, orderStatus }: { orderId: string; orderStatus?: string }) {
  const { user, token } = useAuth();
  const admin = isDeliveryAdmin(user?.role);
  const { data, isLoading, error } = useDeliveries();
  const { create } = useDeliveryMutations();
  const [assignOpen, setAssignOpen] = useState(false);

  const delivery = (data ?? []).find((d) => deliveryOrderId(d) === orderId) ?? null;
  const rider = delivery ? deliveryRider(delivery) : null;
  const { presence, locations } = useRealtime();

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !orderId) {
      return;
    }

    const joinOrder = () => {
      socket.emit("join:order", {
        orderId,
      });
    };

    if (socket.connected) {
      joinOrder();
    }

    socket.on("connect", joinOrder);

    return () => {
      socket.off("connect", joinOrder);
    };
  }, [orderId]);

  const live = rider?._id ? locations[rider._id] : undefined;
  const online = rider?._id ? presence[rider._id]?.online : undefined;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery</div>
        {delivery && <StatusBadge label={deliveryLabel(delivery.status)} tone={deliveryTone(delivery.status) as any} />}
      </div>

      {isLoading ? (
        <Skeleton className="mt-3 h-10 w-full" />
      ) : error ? (
        <div className="mt-2 text-xs text-muted-foreground">{(error as Error).message}</div>
      ) : !delivery ? (
        <div className="mt-2 space-y-3">
          <div className="text-xs text-muted-foreground">No delivery record for this order yet.</div>
          {admin && orderEligibleForDelivery(orderStatus) && (
            <Button
              size="sm"
              disabled={create.isPending}
              onClick={() =>
                create.mutate(orderId, {
                  onSuccess: (res) => toast.success(res.message || "Delivery created"),
                  onError: (e: any) => toast.error(e.message),
                })
              }
            >
              {create.isPending ? "Creating…" : "Create delivery"}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="text-sm font-medium">{deliveryStateText(delivery)}</div>
          {rider && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{rider.name ?? "Partner"}</span>
                {online !== undefined && (
                  <StatusBadge label={online ? "online" : "offline"} tone={online ? "success" : "neutral"} />
                )}
              </div>
              <div className="text-muted-foreground">
                {[rider.phone, rider.email].filter(Boolean).join(" · ") || "—"}
              </div>
              {live &&
                String(orderStatus ?? "").toUpperCase() !== "DELIVERED" &&
                String(delivery.status ?? "").toUpperCase() !== "DELIVERED" && (
                  <>
                    <div className="mt-1.5 text-muted-foreground">
                      Live location:{" "}
                      <span className="number">
                        {live.lat.toFixed(5)}, {live.lng.toFixed(5)}
                      </span>
                      {" · updated "}
                      {new Date(live.at).toLocaleTimeString()}
                    </div>
                    <LiveDeliveryMap
                      className="mt-3"
                      current={{ latitude: live.lat, longitude: live.lng }}
                      destination={live.destination}
                      deliveryId={delivery._id}
                      token={token}
                      routeBaseUrl="https://fresh15-main.onrender.com"
                      partnerName={rider?.name ?? "Delivery partner"}
                      orderStatus={deliveryStateText(delivery)}
                    />
                  </>
                )}
            </div>
          )}
          {(delivery.deliveryOtpVerified ||
            delivery.customerConfirmedAt ||
            delivery.proofOfDelivery?.photoUrl ||
            delivery.proofOfDelivery?.signatureUrl ||
            delivery.failedDelivery?.reason) && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery proof & verification
              </div>
              {delivery.deliveryOtpVerified && (
                <div className="flex items-center gap-1.5 text-success font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Door OTP verified
                </div>
              )}
              {delivery.customerConfirmedAt && (
                <div className="text-success font-semibold">
                  Customer confirmed receipt {dateTime(delivery.customerConfirmedAt)}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {delivery.proofOfDelivery?.photoUrl && (
                  <a
                    href={delivery.proofOfDelivery.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline"
                  >
                    <Camera className="h-3.5 w-3.5" /> Photo proof
                  </a>
                )}
                {delivery.proofOfDelivery?.signatureUrl && (
                  <a
                    href={delivery.proofOfDelivery.signatureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline"
                  >
                    <PenLine className="h-3.5 w-3.5" /> Signature
                  </a>
                )}
              </div>
              {delivery.failedDelivery?.reason && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                  <div className="flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Failed:{" "}
                    {delivery.failedDelivery.reason.replaceAll("_", " ")}
                  </div>
                  {delivery.failedDelivery.note && <div className="mt-1">{delivery.failedDelivery.note}</div>}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {delivery.assignedAt && <div>Assigned {dateTime(delivery.assignedAt)}</div>}
            {delivery.acceptedAt && <div>Accepted {dateTime(delivery.acceptedAt)}</div>}
            {delivery.pickedUpAt && <div>Picked up {dateTime(delivery.pickedUpAt)}</div>}
            {delivery.deliveredAt && <div>Delivered {dateTime(delivery.deliveredAt)}</div>}
            {delivery.rejectedAt && <div>Rejected {dateTime(delivery.rejectedAt)}</div>}
            {delivery.cancelledAt && <div>Cancelled {dateTime(delivery.cancelledAt)}</div>}
          </div>
          {admin && canAssignRider(delivery) && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <UserPlus className="h-4 w-4" /> {rider ? "Reassign rider" : "Assign rider"}
            </Button>
          )}
          <AssignRiderDialog delivery={delivery} open={assignOpen} onOpenChange={setAssignOpen} />
        </div>
      )}
    </div>
  );
}
