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
import { useOffers, useOfferMutations, type ApiOffer, type OfferInput } from "@/lib/offer-api";
import { Plus, Sparkles, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing/offers")({
  head: () => ({
    meta: [
      { title: "Offers — Fresh15 Admin" },
      { name: "description", content: "Featured promotions across the storefront." },
      { property: "og:title", content: "Offers — Fresh15 Admin" },
      { property: "og:description", content: "Featured promotions across the storefront." },
    ],
  }),
  component: OffersPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const emptyDraft: OfferInput = { title: "", description: "", discount: "20%", category: "fruits", isActive: true };

function OffersPage() {
  const { data: offers = [], isLoading, isError, error } = useOffers();
  const { create, update, setStatus, remove } = useOfferMutations();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiOffer | null>(null);
  const [draft, setDraft] = useState<OfferInput>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiOffer | null>(null);

  const openNew = () => { setEditing(null); setDraft(emptyDraft); setOpen(true); };
  const openEdit = (o: ApiOffer) => {
    setEditing(o);
    setDraft({
      title: o.title || "", description: o.description || "", discount: o.discount || "",
      category: o.category || "", isActive: o.isActive !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title) { toast.error("Title is required"); return; }
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
    const next = o.isActive === false;
    try {
      const res = await setStatus.mutateAsync({ id: o._id, isActive: next });
      toast.success(res.message || (next ? "Offer live" : "Offer paused"));
    } catch (e) { toast.error(errMsg(e, "Unable to update offer status")); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await remove.mutateAsync(toDelete._id);
      toast.success(res.message || "Offer deleted");
    } catch (e) { toast.error(errMsg(e, "Unable to delete offer")); }
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Offers" description="Featured promotions shown across the storefront."
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New offer</Button>} />

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <EmptyState icon={Sparkles} title="Unable to load offers" description={errMsg(error, "Please try again.")} />
      ) : offers.length === 0 ? (
        <EmptyState icon={Sparkles} title="No offers yet" description="Create your first promotion to feature it on the storefront."
          action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New offer</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map(o => (
            <Card key={o._id} className="overflow-hidden p-0 gap-0">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="absolute right-3 top-3">
                  <StatusBadge label={o.isActive !== false ? "live" : "paused"} tone={o.isActive !== false ? "success" : "neutral"} />
                </div>
              </div>
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{o.title}</h3>
                  {o.discount && <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{o.discount}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{o.description}</p>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit offer" : "New offer"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={draft.description ?? ""} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Discount label</Label><Input value={draft.discount ?? ""} onChange={e => setDraft(d => ({ ...d, discount: e.target.value }))} placeholder="30% or ₹100" /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={draft.category ?? ""} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Live on storefront</div>
              <Switch checked={draft.isActive !== false} onCheckedChange={v => setDraft(d => ({ ...d, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={v => !v && setToDelete(null)}
        title="Delete offer?" description={toDelete && <>Remove <b>{toDelete.title}</b> from all placements.</>}
        confirmLabel="Delete" destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
