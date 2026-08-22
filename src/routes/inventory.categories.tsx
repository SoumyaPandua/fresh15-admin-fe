"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAuth } from "@/lib/auth";
import {
  createCategory, deleteCategory, getCategories, isActiveStatus, statusValue,
  toList, updateCategory, updateCategoryStatus, type ApiCategory,
} from "@/lib/catalog";
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/categories")({
  head: () => ({ meta: [{ title: "Categories — Fresh15 Admin" }, { name: "description", content: "Manage product categories." }] }),
  component: CategoriesPage,
});

type Draft = { name: string; slug: string; description: string; active: boolean; image: File | null };
const emptyDraft: Draft = { name: "", slug: "", description: "", active: true, image: null };

function CategoriesPage() {
  const { token } = useAuth();
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories({ limit: 200 }, token);
      setCats(toList<ApiCategory>(res.data));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setCats([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditing(null); setDraft(emptyDraft); setOpen(true); };
  const openEdit = (c: ApiCategory) => {
    setEditing(c);
    setDraft({ name: c.name ?? "", slug: c.slug ?? "", description: c.description ?? "", active: isActiveStatus(c), image: null });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        description: draft.description,
        status: statusValue(draft.active),
        image: draft.image,
      };
      const res = editing
        ? await updateCategory(editing._id, payload, token)
        : await createCategory(payload, token);
      toast.success(res.message || (editing ? "Category updated" : "Category created"));
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: ApiCategory) => {
    const next = !isActiveStatus(c);
    try {
      const res = await updateCategoryStatus(c._id, statusValue(next), token);
      toast.success(res.message || `${c.name} ${next ? "activated" : "hidden"}`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await deleteCategory(toDelete._id, token);
      toast.success(res.message || "Category deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToDelete(null);
    }
  };

  const columns: Column<ApiCategory>[] = [
    { key: "name", header: "Category", render: (c) => (
      <div className="flex items-center gap-3">
        {c.image
          ? <img src={c.image} alt={c.name} className="h-10 w-10 rounded-xl object-cover" />
          : <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-sm font-semibold">{(c.name ?? "?").charAt(0).toUpperCase()}</div>}
        <div>
          <div className="text-sm font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground">{c.slug ? `/${c.slug}` : c._id}</div>
        </div>
      </div>
    )},
    { key: "products", header: "Products", accessor: (c) => c.productCount ?? 0, sortable: true,
      render: (c) => <span className="number text-sm font-medium">{c.productCount ?? "—"}</span> },
    { key: "status", header: "Status", render: (c) => (
      <div className="flex items-center gap-3">
        <StatusBadge label={isActiveStatus(c) ? "active" : "hidden"} tone={isActiveStatus(c) ? "success" : "neutral"} />
        <Switch checked={isActiveStatus(c)} onCheckedChange={() => toggle(c)} />
      </div>
    )},
    { key: "actions", header: "", className: "w-10 text-right", render: (c) => (
      <div onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organise your catalog into browsable groups."
        actions={<>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New category</Button>
        </>} />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <EmptyState icon={Tags} title="Couldn't load categories" description={error}
          action={<Button size="sm" onClick={() => void load()}>Try again</Button>} />
      ) : (
        <DataTable data={cats} columns={columns} searchable={(c) => `${c.name} ${c.slug ?? ""}`} pageSize={12}
          rowId={(c) => c._id} emptyTitle="No categories yet" emptyDescription="Create your first category to organise the catalog." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Slug</Label><Input value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} placeholder="fresh-vegetables" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={e => setDraft(d => ({ ...d, image: e.target.files?.[0] ?? null }))} />
              <p className="text-xs text-muted-foreground">
                {editing ? "Leave empty to keep the current image." : "Optional category thumbnail."}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><div className="text-sm font-medium">Visible in storefront</div><div className="text-xs text-muted-foreground">Show category to customers.</div></div>
              <Switch checked={draft.active} onCheckedChange={v => setDraft(d => ({ ...d, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={v => !v && setToDelete(null)}
        title="Delete category?" description={toDelete && <>Removing <b>{toDelete.name}</b> may be blocked if products still use it.</>}
        confirmLabel="Delete" destructive
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
