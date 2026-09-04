import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeliveryMutations, useRiderAvailability, deliveryRiderId, type ApiDelivery } from "@/lib/delivery-api";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";

export function AssignRiderDialog({
  delivery,
  open,
  onOpenChange,
}: {
  delivery: ApiDelivery | null;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { data: riders, isLoading, refetch } = useRiderAvailability(open);
  const { assign } = useDeliveryMutations();
  const [riderId, setRiderId] = useState("");
  const current = delivery ? deliveryRiderId(delivery) : "";
  const options = riders ?? [];

  const submit = () => {
    if (!delivery || !riderId || assign.isPending) return;
    assign.mutate(
      { id: delivery._id, riderId },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Rider assigned");
          setRiderId("");
          onOpenChange(false);
        },
        onError: (error: any) => toast.error(error.message || "Rider assignment failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !assign.isPending && onOpenChange(value)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? "Reassign rider" : "Assign rider"}</DialogTitle>
          <DialogDescription>Only currently available Fresh15 partners are shown. The backend performs an atomic availability check when you assign.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{options.length} partner{options.length === 1 ? "" : "s"} available</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void refetch()} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading available partners…</div>
          ) : !options.length ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">No partner is available right now. Refresh when a partner becomes available.</div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {options.map((rider: any) => (
                <button key={rider._id} type="button" onClick={() => setRiderId(rider._id)} className={`w-full rounded-xl border p-3 text-left ${riderId === rider._id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <div className="font-semibold">{rider.name || "Delivery partner"}</div>
                  <div className="text-xs text-muted-foreground">{[rider.phone, rider.email].filter(Boolean).join(" · ") || "Available now"}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assign.isPending}>Cancel</Button>
          <Button disabled={!riderId || assign.isPending} onClick={submit}>
            {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
