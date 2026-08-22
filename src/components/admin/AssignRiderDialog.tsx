import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  useDeliveries, useDeliveryMutations, deliveryRider, deliveryRiderId,
  type ApiDelivery, type DeliveryRider,
} from "@/lib/delivery-api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Only real PARTNER accounts may be offered as rider candidates. */
export const isPartnerRider = (r: DeliveryRider | null | undefined) =>
  !!r?._id &&
  (r.role ? r.role.toUpperCase() === "PARTNER" : true) &&
  (r.portal ? r.portal.toLowerCase() === "partner" : true);

/**
 * Rider candidates come from PARTNER users the backend has already populated on
 * delivery records. The backend exposes no partner-directory endpoint yet, so a
 * verified partner id can also be entered manually — the backend validates it.
 */
export function useRiderCandidates() {
  const { data } = useDeliveries();
  return useMemo(() => {
    const map = new Map<string, DeliveryRider>();
    (data ?? []).forEach((d) => {
      const r = deliveryRider(d);
      if (isPartnerRider(r)) map.set(r!._id!, r!);
    });
    return [...map.values()].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [data]);
}

export function AssignRiderDialog({
  delivery,
  open,
  onOpenChange,
}: {
  delivery: ApiDelivery | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const riders = useRiderCandidates();
  const { assign } = useDeliveryMutations();
  const [riderId, setRiderId] = useState("");
  const [manualId, setManualId] = useState("");

  const chosen = riderId === "__manual" ? manualId.trim() : riderId;
  const valid = OBJECT_ID.test(chosen);
  const current = delivery ? deliveryRiderId(delivery) : "";

  const submit = () => {
    if (!delivery || !valid || assign.isPending) return;
    assign.mutate(
      { id: delivery._id, riderId: chosen },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Rider assigned");
          onOpenChange(false);
          setRiderId("");
          setManualId("");
        },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!assign.isPending) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? "Reassign rider" : "Assign rider"}</DialogTitle>
          <DialogDescription>
            Only Fresh15 partner accounts can be assigned. The backend verifies the rider before accepting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Delivery partner</Label>
            <Select value={riderId} onValueChange={setRiderId}>
              <SelectTrigger><SelectValue placeholder={riders.length ? "Select a partner" : "No known partners yet"} /></SelectTrigger>
              <SelectContent>
                {riders.map((r) => (
                  <SelectItem key={r._id} value={r._id!}>
                    {r.name ?? "Partner"}{r.phone ? ` · ${r.phone}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="__manual">Enter partner ID manually…</SelectItem>
              </SelectContent>
            </Select>
            {!riders.length && (
              <p className="text-xs text-muted-foreground">
                Known partners are learned from existing deliveries. Enter a partner ID manually for the first assignment.
              </p>
            )}
          </div>

          {riderId === "__manual" && (
            <div className="space-y-1.5">
              <Label>Partner user ID</Label>
              <Input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="24-character partner ID" />
              {manualId && !valid && <p className="text-xs text-destructive">That doesn't look like a valid partner ID.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assign.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || assign.isPending}>
            {assign.isPending ? "Assigning…" : "Assign rider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
