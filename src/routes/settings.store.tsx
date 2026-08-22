"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { deliveryConfigApi, type AdminDeliveryStore } from "@/lib/delivery-slot-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/store")({
  head: () => ({ meta: [{ title: "Store Settings — Fresh15 Admin" }] }),
  component: StoreSettingsPage,
});

function StoreSettingsPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState<AdminDeliveryStore[]>([]);
  const [draft, setDraft] = useState({
    name: "Fresh15 Dark Store",
    code: "PUNE-01",
    latitude: "",
    longitude: "",
    serviceRadiusKm: 10,
    maxConcurrentOrders: 100,
    prepMinutes: 8,
    active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await deliveryConfigApi.stores(token);
      setStores(list);
      if (list[0]) {
        const s = list[0];
        setEditingId(s._id);
        setDraft({
          name: s.name,
          code: s.code,
          latitude: s.latitude == null ? "" : String(s.latitude),
          longitude: s.longitude == null ? "" : String(s.longitude),
          serviceRadiusKm: s.serviceRadiusKm,
          maxConcurrentOrders: s.maxConcurrentOrders,
          prepMinutes: s.prepMinutes,
          active: s.active,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load stores");
    }
  };
  useEffect(() => {
    void load();
  }, [token]);
  const save = async () => {
    if (!draft.name.trim() || !draft.code.trim()) return toast.error("Store name and code are required");
    const body = {
      name: draft.name.trim(),
      code: draft.code.trim(),
      latitude: draft.latitude === "" ? null : Number(draft.latitude),
      longitude: draft.longitude === "" ? null : Number(draft.longitude),
      serviceRadiusKm: Number(draft.serviceRadiusKm),
      maxConcurrentOrders: Number(draft.maxConcurrentOrders),
      prepMinutes: Number(draft.prepMinutes),
      active: draft.active,
    };
    try {
      if (editingId) await deliveryConfigApi.updateStore(token, editingId, body);
      else {
        const created = await deliveryConfigApi.createStore(token, body);
        setEditingId(created._id);
      }
      toast.success("Store settings saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save store");
    }
  };
  const createAnother = () => {
    setEditingId(null);
    setDraft({
      name: "",
      code: "",
      latitude: "",
      longitude: "",
      serviceRadiusKm: 10,
      maxConcurrentOrders: 100,
      prepMinutes: 8,
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store / Dark Store"
        description="Fulfillment capacity, prep time and service radius used by checkout."
        actions={
          <Button size="sm" variant="outline" onClick={createAnother}>
            New store
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Store name</Label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Prep time (minutes)</Label>
              <Input
                type="number"
                value={draft.prepMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, prepMinutes: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input
                type="number"
                value={draft.latitude}
                onChange={(e) => setDraft((d) => ({ ...d, latitude: e.target.value }))}
                placeholder="18.5204"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input
                type="number"
                value={draft.longitude}
                onChange={(e) => setDraft((d) => ({ ...d, longitude: e.target.value }))}
                placeholder="73.8567"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service radius (km)</Label>
              <Input
                type="number"
                value={draft.serviceRadiusKm}
                onChange={(e) => setDraft((d) => ({ ...d, serviceRadiusKm: Number(e.target.value) }))}
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
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <div className="text-sm font-medium">Store active</div>
                <div className="text-xs text-muted-foreground">Inactive stores are ignored by checkout.</div>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft((d) => ({ ...d, active: v }))} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => void save()}>Save changes</Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold">Configured stores</div>
          <div className="mt-3 space-y-2">
            {stores.map((s) => (
              <button
                key={s._id}
                onClick={() => {
                  setEditingId(s._id);
                  setDraft({
                    name: s.name,
                    code: s.code,
                    latitude: s.latitude == null ? "" : String(s.latitude),
                    longitude: s.longitude == null ? "" : String(s.longitude),
                    serviceRadiusKm: s.serviceRadiusKm,
                    maxConcurrentOrders: s.maxConcurrentOrders,
                    prepMinutes: s.prepMinutes,
                    active: s.active,
                  });
                }}
                className={
                  "w-full rounded-lg border p-3 text-left text-sm " +
                  (s._id === editingId ? "border-primary bg-primary/5" : "hover:bg-muted")
                }
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.code} · {s.maxConcurrentOrders} active · {s.prepMinutes}m prep
                </div>
              </button>
            ))}
            {!stores.length && <p className="text-xs text-muted-foreground">No stores configured.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
