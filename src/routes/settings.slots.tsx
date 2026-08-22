"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Plus, Timer, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deliveryConfigApi, minutesToTime, timeToMinutes, type AdminDeliverySlot } from "@/lib/delivery-slot-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/slots")({
  head: () => ({ meta: [{ title: "Time Slots — Fresh15 Admin" }] }),
  component: SlotsPage,
});

function SlotsPage() {
  const { token } = useAuth();
  const [slots, setSlots] = useState<AdminDeliverySlot[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDeliverySlot | null>(null);
  const [toDelete, setToDelete] = useState<AdminDeliverySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    label: "",
    type: "FIXED" as "ASAP" | "FIXED",
    from: "09:00",
    to: "12:00",
    lead: 15,
    cutoff: 30,
    capacity: 50,
    sortOrder: 0,
    active: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      setSlots(await deliveryConfigApi.slots(token));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load delivery slots");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [token]);

  const openNew = () => {
    setEditing(null);
    setDraft({
      label: "",
      type: "FIXED",
      from: "09:00",
      to: "12:00",
      lead: 15,
      cutoff: 30,
      capacity: 50,
      sortOrder: 0,
      active: true,
    });
    setOpen(true);
  };
  const openEdit = (s: AdminDeliverySlot) => {
    setEditing(s);
    setDraft({
      label: s.label,
      type: s.type,
      from: minutesToTime(s.fromMinutes),
      to: minutesToTime(s.toMinutes),
      lead: s.leadTimeMinutes,
      cutoff: s.cutoffMinutesBeforeStart,
      capacity: s.capacity,
      sortOrder: s.sortOrder,
      active: s.active,
    });
    setOpen(true);
  };
  const save = async () => {
    if (!draft.label.trim()) return toast.error("Label required");
    const body = {
      label: draft.label.trim(),
      type: draft.type,
      fromMinutes: timeToMinutes(draft.from),
      toMinutes: timeToMinutes(draft.to),
      leadTimeMinutes: draft.lead,
      cutoffMinutesBeforeStart: draft.cutoff,
      capacity: draft.capacity,
      sortOrder: draft.sortOrder,
      active: draft.active,
    };
    try {
      if (editing) await deliveryConfigApi.updateSlot(token, editing._id, body);
      else await deliveryConfigApi.createSlot(token, body);
      toast.success(editing ? "Slot updated" : "Slot created");
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save slot");
    }
  };
  const remove = async () => {
    if (!toDelete) return;
    try {
      await deliveryConfigApi.deleteSlot(token, toDelete._id);
      toast.success("Slot deleted");
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete slot");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Slots"
        description="Backend-driven delivery windows, cutoff rules and capacity."
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> New slot
          </Button>
        }
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="h-36 animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No slots configured yet. Create at least one ASAP or fixed slot.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((s) => (
            <Card key={s._id} className="p-5 gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Timer className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.type === "ASAP"
                        ? `ASAP · ${s.leadTimeMinutes} min lead`
                        : `${minutesToTime(s.fromMinutes)} — ${minutesToTime(s.toMinutes)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={s.active}
                    onCheckedChange={(v) =>
                      void deliveryConfigApi
                        .updateSlot(token, s._id, { active: v })
                        .then(load)
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Could not update slot"))
                    }
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDelete(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Capacity: <span className="font-medium text-foreground">{s.capacity}</span> · Cutoff:{" "}
                <span className="font-medium text-foreground">{s.cutoffMinutesBeforeStart} min</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit slot" : "New delivery slot"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Morning / ASAP"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as "ASAP" | "FIXED" }))}
              >
                <option value="ASAP">ASAP</option>
                <option value="FIXED">Fixed window</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="time"
                  value={draft.from}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="time" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Lead time (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.lead}
                  onChange={(e) => setDraft((d) => ({ ...d, lead: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cutoff before start (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.cutoff}
                  onChange={(e) => setDraft((d) => ({ ...d, cutoff: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Base capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.capacity}
                  onChange={(e) => setDraft((d) => ({ ...d, capacity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.sortOrder}
                  onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Slot active</span>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft((d) => ({ ...d, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete slot?"
        description={
          toDelete && (
            <>
              Customers can no longer book <b>{toDelete.label}</b>.
            </>
          )
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => void remove()}
      />
    </div>
  );
}
