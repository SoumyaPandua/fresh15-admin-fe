"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
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
import { useAuth } from "@/lib/auth";
import { getInventory, toList, updateInventory, type ApiInventory } from "@/lib/catalog";
import { Boxes, RefreshCw, AlertTriangle, PackageX, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/stock")({
  head: () => ({
    meta: [
      { title: "Stock — Fresh15 Admin" },
      { name: "description", content: "Live inventory levels across the Fresh15 catalog." },
      { property: "og:title", content: "Stock — Fresh15 Admin" },
      { property: "og:description", content: "Live inventory levels across the Fresh15 catalog." },
    ],
  }),
  component: StockPage,
});

type StockAction = "RESTOCK" | "ADJUST";

const productOf = (i: ApiInventory) => (typeof i.productId === "object" && i.productId ? i.productId : null);

const num = (v?: number) => (typeof v === "number" ? v : 0);

function StockPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ApiInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ApiInventory | null>(null);
  const [action, setAction] = useState<StockAction>("RESTOCK");
  const [quantity, setQuantity] = useState("0");
  const [threshold, setThreshold] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventory({ limit: 200 }, token);
      setRows(toList<ApiInventory>(res.data));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const available = (i: ApiInventory) =>
    typeof i.availableStock === "number" ? i.availableStock : num(i.currentStock) - num(i.reservedStock);

  const low = rows.filter((i) => available(i) > 0 && available(i) <= num(i.lowStockThreshold ?? 15)).length;

  const out = rows.filter((i) => available(i) <= 0).length;

  const previewStock = useMemo(() => {
    if (!selected) return 0;
    const value = Number(quantity);
    if (!Number.isFinite(value)) return num(selected.currentStock);
    return action === "RESTOCK" ? num(selected.currentStock) + value : value;
  }, [action, quantity, selected]);

  const openManage = (inventory: ApiInventory, nextAction: StockAction = "RESTOCK") => {
    setSelected(inventory);
    setAction(nextAction);
    setQuantity(nextAction === "RESTOCK" ? "0" : String(num(inventory.currentStock)));
    setThreshold(String(num(inventory.lowStockThreshold ?? 10)));
  };

  const closeManage = () => {
    if (saving) return;
    setSelected(null);
    setQuantity("0");
  };

  const save = async () => {
    if (!selected) return;

    const rawQuantity = Number(quantity);
    const rawThreshold = Number(threshold);

    if (!Number.isInteger(rawQuantity) || rawQuantity < 0) {
      toast.error("Enter a valid whole-number stock value.");
      return;
    }

    if (!Number.isInteger(rawThreshold) || rawThreshold < 0) {
      toast.error("Low-stock threshold must be zero or greater.");
      return;
    }

    const current = num(selected.currentStock);
    const nextStock = action === "RESTOCK" ? current + rawQuantity : rawQuantity;
    const reserved = num(selected.reservedStock);

    if (nextStock < reserved) {
      toast.error(`Stock cannot be lower than reserved stock (${reserved}).`);
      return;
    }

    setSaving(true);

    try {
      const res = await updateInventory(
        selected._id,
        {
          currentStock: nextStock,
          lowStockThreshold: rawThreshold,
        },
        token,
      );

      const updated = res.data;
      setRows((prev) => prev.map((row) => (row._id === selected._id ? updated : row)));

      toast.success(
        action === "RESTOCK"
          ? `${productOf(selected)?.name ?? "Product"} restocked successfully.`
          : `${productOf(selected)?.name ?? "Product"} stock updated successfully.`,
      );

      closeManage();
    } catch (e: any) {
      toast.error(e.message || "Unable to update inventory.");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ApiInventory>[] = [
    {
      key: "product",
      header: "Product",
      render: (i) => {
        const p = productOf(i);
        return (
          <div className="flex items-center gap-3">
            {p?.images?.[0] ? (
              <img src={p.images[0]} alt={p.name ?? ""} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {p?.name ?? (typeof i.productId === "string" ? i.productId : "—")}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {[p?.sku, p?.unit].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "currentStock",
      header: "Current",
      accessor: (i) => num(i.currentStock),
      sortable: true,
      render: (i) => <span className="number text-sm font-medium">{num(i.currentStock)}</span>,
    },
    {
      key: "reservedStock",
      header: "Reserved",
      accessor: (i) => num(i.reservedStock),
      sortable: true,
      render: (i) => <span className="number text-sm text-muted-foreground">{num(i.reservedStock)}</span>,
    },
    {
      key: "availableStock",
      header: "Available",
      accessor: available,
      sortable: true,
      render: (i) => (
        <span
          className={`number text-sm font-semibold ${
            available(i) <= 0
              ? "text-destructive"
              : available(i) <= num(i.lowStockThreshold ?? 15)
                ? "text-[color:var(--warning)]"
                : ""
          }`}
        >
          {available(i)}
        </span>
      ),
    },
    {
      key: "threshold",
      header: "Low-stock at",
      accessor: (i) => num(i.lowStockThreshold),
      sortable: true,
      render: (i) => <span className="number text-sm text-muted-foreground">{num(i.lowStockThreshold)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (i) => {
        const s = (i.status ?? (available(i) <= 0 ? "out_of_stock" : "in_stock")).toString();
        const tone = s.toLowerCase().includes("out")
          ? "danger"
          : s.toLowerCase().includes("low")
            ? "warning"
            : "success";
        return <StatusBadge label={s.replace(/_/g, " ").toLowerCase()} tone={tone as any} />;
      },
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (i) =>
        i.updatedAt
          ? new Date(i.updatedAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-[170px] text-right",
      render: (i) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => openManage(i, "RESTOCK")}>
            <Plus className="h-4 w-4" />
            Restock
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit stock"
            onClick={() => openManage(i, "ADJUST")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description="Live inventory levels straight from the backend."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tracked SKUs" value={String(rows.length)} icon={Boxes} />
        <StatCard label="Low stock" value={String(low)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of stock" value={String(out)} icon={PackageX} tone="danger" />
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <EmptyState
          icon={Boxes}
          title="Couldn't load inventory"
          description={error}
          action={
            <Button size="sm" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          pageSize={12}
          rowId={(i) => i._id}
          bulkActions={false}
          searchable={(i) => `${productOf(i)?.name ?? ""} ${productOf(i)?.sku ?? ""}`}
          emptyTitle="No inventory records"
          emptyDescription="Inventory appears once products are stocked."
        />
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeManage()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action === "RESTOCK" ? "Restock inventory" : "Adjust stock"}</DialogTitle>
            <DialogDescription>
              {productOf(selected ?? ({} as ApiInventory))?.name ?? "Product"}
              {" · "}
              Current stock: {num(selected?.currentStock)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={action === "RESTOCK" ? "default" : "outline"}
                onClick={() => {
                  setAction("RESTOCK");
                  setQuantity("0");
                }}
              >
                <Plus className="h-4 w-4" />
                Restock
              </Button>
              <Button
                type="button"
                variant={action === "ADJUST" ? "default" : "outline"}
                onClick={() => {
                  setAction("ADJUST");
                  setQuantity(String(num(selected?.currentStock)));
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Set stock
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>{action === "RESTOCK" ? "Quantity to add" : "New current stock"}</Label>
              <Input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Low-stock threshold</Label>
              <Input type="number" min="0" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New current stock</span>
                <span className="number font-semibold">{previewStock}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Reserved</span>
                <span className="number">{num(selected?.reservedStock)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">New available</span>
                <span className="number font-semibold">{Math.max(previewStock - num(selected?.reservedStock), 0)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Reserved stock is controlled by active orders and cannot be reduced by this screen.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeManage} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
