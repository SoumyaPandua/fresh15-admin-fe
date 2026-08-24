"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useOffers, useOfferMutations, type ApiOffer, type OfferInput, type OfferTargetType } from "@/lib/offer-api";
import { Plus, Sparkles, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing/offers")({
  head: () => ({ meta: [{ title: "Offers — Fresh15 Admin" }, { name: "description", content: "Featured promotions across the storefront." }] }),
  component: OffersPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

const emptyDraft: OfferInput = {
  title: "",
  description: "",
  discount: "20%",
  category: "fruits",
  placement: "HOME",
  ctaText: "View offer",
  targetType: "SEARCH",
  targetValue: "",
  couponCode: "",
  priority: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
};

const targetLabels: Record<OfferTargetType, string> = {
  NONE: "No action",
  SEARCH: "Search",
  CATEGORY: "Category",
  PRODUCT: "Product",
  OFFER: "Offer",
};

function OffersPage() {
  const { data: offers = [], isLoading, isError, error } = useOffers();
  const { create, update, setStatus, remove } = useOfferMutations();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiOffer | null>(null);
  const [draft, setDraft] = useState<OfferInput>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiOffer | null>(null);

  const openNew = () => { setEditing(null); setDraft({ ...emptyDraft }); setOpen(true); };

  const openEdit = (o: ApiOffer) => {
    setEditing(o);
    setDraft({
      title: o.title || "",
      description: o.description || "",
      discount: o.discount || "",
      category: o.category || "",
      placement: o.placement || "HOME",
      ctaText: o.ctaText || "View offer",
      targetType: o.targetType || "SEARCH",
      targetValue: o.targetValue || "",
      couponCode: o.couponCode || "",
      priority: o.priority ?? 0,
      startsAt: o.startsAt ? new Date(o.startsAt).toISOString().slice(0, 16) : null,
      endsAt: o.endsAt ? new Date(o.endsAt).toISOString().slice(0, 16) : null,
      isActive: o.isActive !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title?.trim()) { toast.error("Title is required"); return; }
    if (!draft.discount?.trim()) { toast.error("Discount label is required"); return; }
    if (draft.targetType !== "NONE" && !draft.targetValue?.trim()) { toast.error("Target value is required"); return; }

    try {
      if (editing) {
        const res = await update.mutateAsync({ id: editing._id, input: draft });
        toast.success(res.message || "Offer updated");
      } else {
        const res = await create.mutateAsync(draft);
        toast.success(res.message || "Offer created");
      }
      setOpen(false);
    } catch (e) {
      toast.error(errMsg(e, "Unable to save offer"));
    }
  };

  const toggle = async (o: ApiOffer) => {
    try {
      const res = await setStatus.mutateAsync({ id: o._id, isActive: o.isActive === false });
      toast.success(res.message || "Offer status updated");
    } catch (e) {
      toast.error(errMsg(e, "Unable to update offer status"));
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await remove.mutateAsync(toDelete._id);
      toast.success(res.message || "Offer deleted");
    } catch (e) {
      toast.error(errMsg(e, "Unable to delete offer"));
    }
    setToDelete(null);
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Storefront promotions. Link a real coupon when the offer should discount checkout."
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New offer</Button>}
      />

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <EmptyState icon={Sparkles} title="Unable to load offers" description={errMsg(error, "Please try again.")} />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No offers yet"
          description="Create your first promotion to feature it on the storefront."
          action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New offer</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Card key={o._id} className="overflow-hidden p-0 gap-0">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><Sparkles className="h-6 w-6" /></div>
                <div className="absolute right-3 top-3"><StatusBadge label={o.isActive !== false ? "live" : "paused"} tone={o.isActive !== false ? "success" : "neutral"} /></div>
              </div>
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{o.title}</h3>
                  {o.discount && <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{o.discount}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{o.description}</p>
                <div className="text-xs text-muted-foreground">
                  {o.placement || "HOME"} · {o.ctaText || "View offer"}{o.couponCode ? ` · Coupon ${o.couponCode}` : ""}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground capitalize">{o.category}</span>
                  <div className="flex items-center gap-1">
                    <Switch checked={o.isActive !== false} onCheckedChange={() => toggle(o)} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(o)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit offer" : "New offer"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Discount label</Label><Input value={draft.discount ?? ""} onChange={(e) => setDraft((d) => ({ ...d, discount: e.target.value }))} placeholder="30% or ₹100" /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={draft.category ?? ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Placement</Label>
                <select value={draft.placement ?? "HOME"} onChange={(e) => setDraft((d) => ({ ...d, placement: e.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="HOME">Home</option>
                  <option value="CART">Cart</option>
                  <option value="CATEGORY">Category</option>
                  <option value="SEARCH">Search</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Priority</Label><Input type="number" min={0} max={1000} value={draft.priority ?? 0} onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) || 0 }))} /></div>
            </div>

            <div className="space-y-1.5"><Label>CTA text</Label><Input value={draft.ctaText ?? ""} onChange={(e) => setDraft((d) => ({ ...d, ctaText: e.target.value }))} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <select value={draft.targetType ?? "SEARCH"} onChange={(e) => setDraft((d) => ({ ...d, targetType: e.target.value as OfferTargetType }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.entries(targetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Target value</Label>
                <Input value={draft.targetValue ?? ""} disabled={draft.targetType === "NONE"} onChange={(e) => setDraft((d) => ({ ...d, targetValue: e.target.value }))} placeholder="Search text / category slug / product id" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Coupon code (optional)</Label>
              <Input value={draft.couponCode ?? ""} onChange={(e) => setDraft((d) => ({ ...d, couponCode: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
              <p className="text-xs text-muted-foreground">If provided, the code must already exist in Coupons. Customers can apply it directly from the storefront.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Starts at</Label><Input type="datetime-local" value={draft.startsAt ? draft.startsAt.slice(0, 16) : ""} onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value || null }))} /></div>
              <div className="space-y-1.5"><Label>Ends at</Label><Input type="datetime-local" value={draft.endsAt ? draft.endsAt.slice(0, 16) : ""} onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value || null }))} /></div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Live on storefront</div>
              <Switch checked={draft.isActive !== false} onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete offer?"
        description={toDelete && <>Remove <b>{toDelete.title}</b> from the storefront.</>}
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
