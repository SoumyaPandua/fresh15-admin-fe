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
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useBanners, useBannerMutations, type ApiBanner, type BannerInput, type BannerTargetType } from "@/lib/banner-api";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Fresh15 Admin" },
      { name: "description", content: "App and web banner placements." },
    ],
  }),
  component: BannersPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

const emptyDraft: BannerInput = {
  title: "",
  subtitle: "",
  placement: "HOME_PROMO",
  ctaText: "Shop now",
  targetType: "SEARCH",
  targetValue: "",
  priority: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  image: null,
};

const targetLabels: Record<BannerTargetType, string> = {
  NONE: "No action",
  SEARCH: "Search",
  CATEGORY: "Category",
  PRODUCT: "Product",
  OFFER: "Offer",
};

function BannersPage() {
  const { data: banners = [], isLoading, isError, error } = useBanners();
  const { create, update, setStatus, remove } = useBannerMutations();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiBanner | null>(null);
  const [draft, setDraft] = useState<BannerInput>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiBanner | null>(null);

  const openNew = () => {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setOpen(true);
  };

  const openEdit = (b: ApiBanner) => {
    setEditing(b);
    setDraft({
      title: b.title || "",
      subtitle: b.subtitle || "",
      placement: b.placement || "HOME_PROMO",
      ctaText: b.ctaText || "Shop now",
      targetType: b.targetType || "SEARCH",
      targetValue: b.targetValue || "",
      priority: b.priority ?? 0,
      startsAt: b.startsAt ? new Date(b.startsAt).toISOString().slice(0, 16) : null,
      endsAt: b.endsAt ? new Date(b.endsAt).toISOString().slice(0, 16) : null,
      isActive: b.isActive !== false,
      image: null,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    if (draft.targetType !== "NONE" && !draft.targetValue?.trim()) {
      toast.error("Target value is required for this target type");
      return;
    }

    try {
      if (editing) {
        const res = await update.mutateAsync({ id: editing._id, input: draft });
        toast.success(res.message || "Banner updated");
      } else {
        if (!draft.image) {
          toast.error("Banner image is required");
          return;
        }
        const res = await create.mutateAsync(draft);
        toast.success(res.message || "Banner created");
      }
      setOpen(false);
    } catch (e) {
      toast.error(errMsg(e, "Unable to save banner"));
    }
  };

  const toggle = async (b: ApiBanner) => {
    try {
      const res = await setStatus.mutateAsync({ id: b._id, isActive: b.isActive === false });
      toast.success(res.message || "Banner status updated");
    } catch (e) {
      toast.error(errMsg(e, "Unable to update banner status"));
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await remove.mutateAsync(toDelete._id);
      toast.success(res.message || "Banner deleted");
    } catch (e) {
      toast.error(errMsg(e, "Unable to delete banner"));
    }
    setToDelete(null);
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Create storefront campaigns with placement, scheduling and a real destination."
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New banner</Button>}
      />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <EmptyState icon={ImageIcon} title="Unable to load banners" description={errMsg(error, "Please try again.")} />
      ) : banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No banners yet"
          description="Create your first banner placement."
          action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New banner</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => (
            <Card key={b._id} className="overflow-hidden p-0 gap-0">
              <div className="relative aspect-[16/8] overflow-hidden bg-muted">
                {b.image && <img src={b.image} alt={b.title || "Banner"} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="text-lg font-semibold">{b.title}</div>
                  <div className="text-xs opacity-90">{b.subtitle}</div>
                </div>
                <div className="absolute right-3 top-3">
                  <StatusBadge label={b.isActive !== false ? "live" : "paused"} tone={b.isActive !== false ? "success" : "neutral"} />
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{b.placement}</span>
                  <span className="text-xs font-medium">Priority {b.priority ?? 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.ctaText || "Shop now"} · {targetLabels[b.targetType || "SEARCH"]}{b.targetValue ? `: ${b.targetValue}` : ""}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Switch checked={b.isActive !== false} onCheckedChange={() => toggle(b)} />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subtitle</Label><Input value={draft.subtitle ?? ""} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Placement</Label>
                <select value={draft.placement ?? "HOME_PROMO"} onChange={(e) => setDraft((d) => ({ ...d, placement: e.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="HOME_HERO">Home hero</option>
                  <option value="HOME_PROMO">Home promo</option>
                  <option value="HOME_MID">Home mid-page</option>
                  <option value="CATEGORY">Category</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Priority</Label><Input type="number" min={0} max={1000} value={draft.priority ?? 0} onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) || 0 }))} /></div>
            </div>

            <div className="space-y-1.5"><Label>CTA text</Label><Input value={draft.ctaText ?? ""} onChange={(e) => setDraft((d) => ({ ...d, ctaText: e.target.value }))} placeholder="Shop now" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <select value={draft.targetType ?? "SEARCH"} onChange={(e) => setDraft((d) => ({ ...d, targetType: e.target.value as BannerTargetType }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.entries(targetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Target value</Label>
                <Input value={draft.targetValue ?? ""} disabled={draft.targetType === "NONE"} onChange={(e) => setDraft((d) => ({ ...d, targetValue: e.target.value }))} placeholder={draft.targetType === "CATEGORY" ? "vegetables" : draft.targetType === "PRODUCT" ? "product id" : draft.targetType === "OFFER" ? "offer id" : "search text"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Starts at</Label><Input type="datetime-local" value={draft.startsAt ? draft.startsAt.slice(0, 16) : ""} onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value || null }))} /></div>
              <div className="space-y-1.5"><Label>Ends at</Label><Input type="datetime-local" value={draft.endsAt ? draft.endsAt.slice(0, 16) : ""} onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value || null }))} /></div>
            </div>

            <div className="space-y-1.5">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setDraft((d) => ({ ...d, image: e.target.files?.[0] ?? null }))} />
              {editing?.image && !draft.image && <p className="text-xs text-muted-foreground">Current image kept unless a new one is selected.</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Live</div>
              <Switch checked={!!draft.isActive} onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
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
        title="Delete banner?"
        description={toDelete && <>Remove <b>{toDelete.title}</b> from all placements.</>}
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
