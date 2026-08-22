"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, FilterChip, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { useAuth } from "@/lib/auth";
import {
  MAX_PRODUCT_IMAGES,
  categoryId,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  isActiveStatus,
  toList,
  updateProduct,
  updateProductStatus,
  statusValue,
  type ApiCategory,

  type ApiProduct,
  type ProductUnit,
} from "@/lib/catalog";
import { inr } from "@/lib/format";
import { Plus, Package, AlertTriangle, PackageX, MoreHorizontal, Pencil, Trash2, RefreshCw, Power } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [
      { title: "Products — Fresh15 Admin" },
      { name: "description", content: "Manage inventory across the Fresh15 catalog." },
    ],
  }),
  component: ProductsPage,
});

type Draft = {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  sellingPrice: number;
  mrp: number;
  stock: number;
  unit: ProductUnit;
  weight: number;
  active: boolean;
  images: File[];
};
const emptyDraft: Draft = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  sellingPrice: 0,
  mrp: 0,
  stock: 0,
  unit: "KG",
  weight: 1,
  active: true,
  images: [],
};

const firstImage = (p: ApiProduct) => p.images?.[0] ?? "";

function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [toDelete, setToDelete] = useState<ApiProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({ limit: 200 }, token),
        getCategories({ limit: 200 }, token),
      ]);
      setProducts(toList<ApiProduct>(prodRes.data));
      setCategories(toList<ApiCategory>(catRes.data));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const catName = useCallback(
    (p: ApiProduct) => {
      if (p.category && typeof p.category === "object" && p.category.name) return p.category.name;
      return categories.find((c) => c._id === categoryId(p))?.name ?? "—";
    },
    [categories],
  );

  // Category filtering stays client-side unless the backend confirms support.
  const filtered = useMemo(() => (cat ? products.filter((p) => categoryId(p) === cat) : products), [products, cat]);
  const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 15).length;
  const oos = products.filter((p) => (p.stock ?? 0) === 0).length;

  const openNew = () => {
    setEditing(null);

    setDraft({
      ...emptyDraft,
      categoryId: categories[0]?._id ?? "",
    });

    setOpenForm(true);
  };
  const openEdit = (p: ApiProduct) => {
    setEditing(p);

    setDraft({
      name: p.name ?? "",
      sku: p.sku ?? "",
      description: p.description ?? "",
      categoryId: categoryId(p),
      sellingPrice: p.sellingPrice ?? 0,
      mrp: p.mrp ?? 0,
      stock: p.stock ?? 0,
      unit: p.unit ?? "KG",
      weight: p.weight ?? 1,
      active: p.isActive ?? true,
      images: [],
    });

    setOpenForm(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!draft.sku.trim()) {
      toast.error("SKU is required");
      return;
    }

    if (!draft.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (draft.weight < 0) {
      toast.error("Weight cannot be negative");
      return;
    }

    if (draft.sellingPrice < 0) {
      toast.error("Selling price cannot be negative");
      return;
    }

    if (draft.mrp < 0) {
      toast.error("MRP cannot be negative");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        description: draft.description.trim(),
        categoryId: draft.categoryId,
        sellingPrice: Number(draft.sellingPrice),
        mrp: Number(draft.mrp),
        stock: Number(draft.stock),
        unit: draft.unit,
        weight: Number(draft.weight),
        isActive: draft.active,
        images: draft.images,
      };

      const res = editing ? await updateProduct(editing._id, payload, token) : await createProduct(payload, token);

      toast.success(res.message || (editing ? "Product updated" : "Product created"));

      setOpenForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: ApiProduct) => {
    try {
      const res = await updateProductStatus(p._id, statusValue(!isActiveStatus(p)), token);
      toast.success(res.message || "Status updated");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await deleteProduct(toDelete._id, token);
      toast.success(res.message || "Product deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToDelete(null);
    }
  };

  const columns: Column<ApiProduct>[] = [
    {
      key: "name",
      header: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          {firstImage(p) ? (
            <img src={firstImage(p)} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{p.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {[p.sku, p.unit].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (p) => <span className="text-sm">{catName(p)}</span> },
    {
      key: "price",
      header: "Price",
      accessor: (p) => p.sellingPrice ?? 0,
      sortable: true,
      render: (p) => (
        <div>
          <div className="number text-sm font-semibold">{inr(p.sellingPrice ?? 0)}</div>

          {(p.mrp ?? 0) > (p.sellingPrice ?? 0) && (
            <div className="text-xs text-muted-foreground line-through">{inr(p.mrp ?? 0)}</div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      accessor: (p) => p.stock ?? 0,
      sortable: true,
      render: (p) => (
        <span
          className={`number text-sm font-medium ${(p.stock ?? 0) === 0 ? "text-destructive" : (p.stock ?? 0) < 15 ? "text-[color:var(--warning)]" : ""}`}
        >
          {p.stock ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge
          label={(p.status ?? (isActiveStatus(p) ? "active" : "inactive")).replace("_", " ")}
          tone={isActiveStatus(p) ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10 text-right",
      render: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(p)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void toggleStatus(p)}>
                <Power className="h-4 w-4" /> {isActiveStatus(p) ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(p)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Full inventory across all categories."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" /> New product
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={String(products.length)} icon={Package} />
        <StatCard label="Active" value={String(products.filter(isActiveStatus).length)} icon={Package} tone="success" />
        <StatCard label="Low stock" value={String(lowStock)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of stock" value={String(oos)} icon={PackageX} tone="danger" />
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <EmptyState
          icon={Package}
          title="Couldn't load products"
          description={error}
          action={
            <Button size="sm" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          pageSize={12}
          rowId={(p) => p._id}
          searchable={(p) => `${p.name} ${p.sku ?? ""}`}
          emptyTitle="No products yet"
          emptyDescription="Create your first product to start selling."
          filters={
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={cat === null} onClick={() => setCat(null)}>
                All categories
              </FilterChip>
              {categories.slice(0, 6).map((c) => (
                <FilterChip key={c._id} active={cat === c._id} onClick={() => setCat(c._id)}>
                  {c.name}
                </FilterChip>
              ))}
            </div>
          }
        />
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update inventory details." : "Add a new SKU to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[65vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={draft.sku} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.categoryId} onValueChange={(v) => setDraft((d) => ({ ...d, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={draft.sellingPrice}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    sellingPrice: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>MRP (₹)</Label>
              <Input
                type="number"
                value={draft.mrp}
                onChange={(e) => setDraft((d) => ({ ...d, mrp: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input
                type="number"
                value={draft.stock}
                onChange={(e) => setDraft((d) => ({ ...d, stock: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select
                value={draft.unit}
                onValueChange={(value) =>
                  setDraft((d) => ({
                    ...d,
                    unit: value as ProductUnit,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="KG">Kilogram (kg)</SelectItem>
                  <SelectItem value="GRAM">Gram (g)</SelectItem>
                  <SelectItem value="LITER">Liter (L)</SelectItem>
                  <SelectItem value="ML">Milliliter (ml)</SelectItem>
                  <SelectItem value="PIECE">Piece</SelectItem>
                  <SelectItem value="PACK">Pack</SelectItem>
                  <SelectItem value="DOZEN">Dozen</SelectItem>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Weight</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.weight}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    weight: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setDraft((d) => ({ ...d, images: Array.from(e.target.files ?? []).slice(0, MAX_PRODUCT_IMAGES) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Up to {MAX_PRODUCT_IMAGES} images.{editing ? " Leave empty to keep the current images." : ""}
              </p>
              {editing && !!editing.images?.length && (
                <div className="flex gap-2 pt-1">
                  {editing.images.slice(0, MAX_PRODUCT_IMAGES).map((src, i) => (
                    <img key={i} src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete product?"
        description={
          toDelete && (
            <>
              This will permanently remove <span className="font-medium">{toDelete.name}</span> from the catalog.
            </>
          )
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
