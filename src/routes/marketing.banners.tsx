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
import { useBanners, useBannerMutations, type ApiBanner, type BannerInput } from "@/lib/banner-api";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Fresh15 Admin" },
      { name: "description", content: "App and web banner placements." },
      { property: "og:title", content: "Banners — Fresh15 Admin" },
      { property: "og:description", content: "App and web banner placements." },
    ],
  }),
  component: BannersPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const emptyDraft: BannerInput = { title: "", subtitle: "", placement: "Home Hero", isActive: true, image: null };

function BannersPage() {
  const { data: banners = [], isLoading, isError, error } = useBanners();
  const { create, update, setStatus, remove } = useBannerMutations();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiBanner | null>(null);
  const [draft, setDraft] = useState<BannerInput>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiBanner | null>(null);

  const openNew = () => { setEditing(null); setDraft(emptyDraft); setOpen(true); };
  const openEdit = (b: ApiBanner) => {
    setEditing(b);
    setDraft({
      title: b.title || "", subtitle: b.subtitle || "", placement: b.placement || "",
      isActive: b.isActive !== false, image: null,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.title) { toast.error("Title is required"); return; }
    try {
      if (editing) {
        const res = await update.mutateAsync({ id: editing._id, input: draft });
        toast.success(res.message || "Banner updated");
      } else {
        const res = await create.mutateAsync(draft);
        toast.success(res.message || "Banner created");
      }
      setOpen(false);
    } catch (e) {
      toast.error(errMsg(e, "Unable to save banner"));
    }
  };

  const toggle = async (b: ApiBanner) => {
    const next = b.isActive === false;
    try {
      const res = await setStatus.mutateAsync({ id: b._id, isActive: next });
      toast.success(res.message || (next ? "Banner live" : "Banner paused"));
    } catch (e) { toast.error(errMsg(e, "Unable to update banner status")); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await remove.mutateAsync(toDelete._id);
      toast.success(res.message || "Banner deleted");
    } catch (e) { toast.error(errMsg(e, "Unable to delete banner")); }
    setToDelete(null);
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Hero and promotional banners across the app."
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New banner</Button>} />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <EmptyState icon={ImageIcon} title="Unable to load banners" description={errMsg(error, "Please try again.")} />
      ) : banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No banners yet" description="Create your first banner placement."
          action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New banner</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map(b => (
            <Card key={b._id} className="overflow-hidden p-0 gap-0">
              <div className="relative aspect-[16/8] overflow-hidden bg-muted">
                {b.image && <img src={b.image} alt={b.title || "Banner"} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="text-lg font-semibold">{b.title}</div>
                  <div className="text-xs opacity-90">{b.subtitle}</div>
                </div>
                <div className="absolute right-3 top-3">
                  <StatusBadge label={b.isActive !== false ? "live" : "draft"} tone={b.isActive !== false ? "success" : "neutral"} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">{b.placement}</span>
                <div className="flex items-center gap-1">
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title ?? ""} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subtitle</Label><Input value={draft.subtitle ?? ""} onChange={e => setDraft(d => ({ ...d, subtitle: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Placement</Label><Input value={draft.placement ?? ""} onChange={e => setDraft(d => ({ ...d, placement: e.target.value }))} placeholder="Home Hero" /></div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={e => setDraft(d => ({ ...d, image: e.target.files?.[0] ?? null }))} />
              {editing?.image && !draft.image && <p className="text-xs text-muted-foreground">Current image kept unless a new one is selected.</p>}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm font-medium">Live</div>
              <Switch checked={!!draft.isActive} onCheckedChange={v => setDraft(d => ({ ...d, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={v => !v && setToDelete(null)}
        title="Delete banner?" description={toDelete && <>Remove <b>{toDelete.title}</b> from all placements.</>}
        confirmLabel="Delete" destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
