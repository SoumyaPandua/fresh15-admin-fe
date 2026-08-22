"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { deliveryConfigApi, type AdminDeliveryZone } from "@/lib/delivery-slot-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/zones")({
  head: () => ({ meta: [{ title: "Delivery Zones — Fresh15 Admin" }] }),
  component: ZonesPage,
});

function ZonesPage() {
  const { token } = useAuth();
  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [editing, setEditing] = useState<AdminDeliveryZone | null>(null);
  const [toDelete, setToDelete] = useState<AdminDeliveryZone | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    city: "",
    pincodes: "",
    fee: 29,
    minOrder: 199,
    maxConcurrentOrders: 100,
    travelMinutes: 10,
    workloadDelayMinutes: 3,
    active: true,
  });

  const load = async () => {
    try {
      setZones(await deliveryConfigApi.zones(token));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load zones");
    }
  };
  useEffect(() => {
    void load();
  }, [token]);
  const openNew = () => {
    setEditing(null);
    setDraft({
      name: "",
      city: "",
      pincodes: "",
      fee: 29,
      minOrder: 199,
      maxConcurrentOrders: 100,
      travelMinutes: 10,
      workloadDelayMinutes: 3,
      active: true,
    });
    setOpen(true);
  };
  const openEdit = (z: AdminDeliveryZone) => {
    setEditing(z);
    setDraft({
      name: z.name,
      city: z.city ?? "",
      pincodes: z.pincodes.join(", "),
      fee: z.fee,
      minOrder: z.minOrder,
      maxConcurrentOrders: z.maxConcurrentOrders,
      travelMinutes: z.travelMinutes,
      workloadDelayMinutes: z.workloadDelayMinutes,
      active: z.active,
    });
    setOpen(true);
  };
  const save = async () => {
    const pincodes = draft.pincodes
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!draft.name.trim() || !pincodes.length) return toast.error("Zone name and at least one pincode are required");
    const body = { ...draft, name: draft.name.trim(), pincodes };
    try {
      if (editing) await deliveryConfigApi.updateZone(token, editing._id, body);
      else await deliveryConfigApi.createZone(token, body);
      toast.success(editing ? "Zone updated" : "Zone created");
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save zone");
    }
  };
  const remove = async () => {
    if (!toDelete) return;
    try {
      await deliveryConfigApi.deleteZone(token, toDelete._id);
      toast.success("Zone deleted");
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete zone");
    }
  };
  const columns: Column<AdminDeliveryZone>[] = [
    {
      key: "zone",
      header: "Zone",
      render: (z) => (
        <div>
          <div className="text-sm font-medium">{z.name}</div>
          <div className="text-xs text-muted-foreground">
            {z.city || "—"} · {z.pincodes.join(", ")}
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Max active",
      render: (z) => <span className="number text-sm">{z.maxConcurrentOrders}</span>,
    },
    {
      key: "eta",
      header: "Travel / load",
      render: (z) => (
        <span className="number text-sm">
          {z.travelMinutes}m / +{z.workloadDelayMinutes}m
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (z) => (
        <div className="flex items-center gap-3">
          <StatusBadge label={z.active ? "active" : "paused"} tone={z.active ? "success" : "neutral"} />
          <Switch
            checked={z.active}
            onCheckedChange={(v) =>
              void deliveryConfigApi
                .updateZone(token, z._id, { active: v })
                .then(load)
                .catch((e) => toast.error(e instanceof Error ? e.message : "Could not update zone"))
            }
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20 text-right",
      render: (z) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(z)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setToDelete(z)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Zones"
        description="Map pincodes to service areas and workload limits."
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> New zone
          </Button>
        }
      />
      <DataTable
        data={zones}
        columns={columns}
        searchable={(z) => `${z.name} ${z.city} ${z.pincodes.join(" ")}`}
        pageSize={10}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit zone" : "New zone"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pincodes</Label>
              <Input
                value={draft.pincodes}
                onChange={(e) => setDraft((d) => ({ ...d, pincodes: e.target.value }))}
                placeholder="411001, 411007"
              />
              <div className="text-xs text-muted-foreground">
                Comma-separated. Checkout uses the selected address pincode.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Delivery fee</Label>
                <Input
                  type="number"
                  value={draft.fee}
                  onChange={(e) => setDraft((d) => ({ ...d, fee: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum order</Label>
                <Input
                  type="number"
                  value={draft.minOrder}
                  onChange={(e) => setDraft((d) => ({ ...d, minOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max active orders</Label>
                <Input
                  type="number"
                  value={draft.maxConcurrentOrders}
                  onChange={(e) => setDraft((d) => ({ ...d, maxConcurrentOrders: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Travel minutes</Label>
                <Input
                  type="number"
                  value={draft.travelMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, travelMinutes: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Workload delay / capacity block</Label>
                <Input
                  type="number"
                  value={draft.workloadDelayMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, workloadDelayMinutes: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">Zone active</span>
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
        title="Delete zone?"
        description={
          toDelete && (
            <>
              Customers in <b>{toDelete.name}</b> will no longer be eligible for delivery.
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
