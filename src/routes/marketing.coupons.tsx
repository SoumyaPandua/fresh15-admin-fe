"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { useAuth } from "@/lib/auth";
import {
  createCoupon, deleteCoupon, getCoupons, toList, updateCoupon, updateCouponStatus,
  type ApiCoupon, type CouponInput,
} from "@/lib/commerce";
import { inr, shortDate } from "@/lib/format";
import { Plus, Ticket, MoreHorizontal, Pencil, Trash2, Copy, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons — Fresh15 Admin" },
      { name: "description", content: "Manage discount coupons." },
      { property: "og:title", content: "Coupons — Fresh15 Admin" },
      { property: "og:description", content: "Manage discount coupons." },
    ],
  }),
  component: CouponsPage,
});

type Draft = {
  code: string;
  title: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount: number;
  minimumOrderAmount: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const dateInput = (v?: string) => (v ? new Date(v).toISOString().slice(0, 10) : "");

const emptyDraft = (): Draft => ({
  code: "", title: "", description: "", discountType: "PERCENTAGE", discountValue: 10,
  maxDiscount: 100, minimumOrderAmount: 199, usageLimit: 1000,
  validFrom: today(), validUntil: "",
});

const draftOf = (c: ApiCoupon): Draft => ({
  code: c.code ?? "",
  title: c.title ?? "",
  description: c.description ?? "",
  discountType: (c.discountType ?? "PERCENTAGE").toUpperCase() === "FIXED" ? "FIXED" : "PERCENTAGE",
  discountValue: c.discountValue ?? 0,
  maxDiscount: c.maxDiscount ?? 0,
  minimumOrderAmount: c.minimumOrderAmount ?? 0,
  usageLimit: c.usageLimit ?? 0,
  validFrom: dateInput(c.validFrom) || today(),
  validUntil: dateInput(c.validUntil),
});

function CouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCoupon | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [toDelete, setToDelete] = useState<ApiCoupon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCoupons({ limit: 200 }, token);
      setCoupons(toList<ApiCoupon>(res.data));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (c: ApiCoupon) => { setEditing(c); setDraft(draftOf(c)); setOpen(true); };

  const save = async () => {
    if (!draft.code.trim()) { toast.error("Code is required"); return; }
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    if (!draft.validUntil) { toast.error("Valid until date is required"); return; }
    const payload: CouponInput = {
      code: draft.code.trim().toUpperCase(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue) || 0,
      minimumOrderAmount: Number(draft.minimumOrderAmount) || 0,
      usageLimit: Number(draft.usageLimit) || 0,
      validFrom: new Date(draft.validFrom || today()).toISOString(),
      validUntil: new Date(draft.validUntil).toISOString(),
      ...(draft.discountType === "PERCENTAGE" && Number(draft.maxDiscount) > 0
        ? { maxDiscount: Number(draft.maxDiscount) }
        : {}),
    };
    setSaving(true);
    try {
      const res = editing
        ? await updateCoupon(editing._id, payload, token)
        : await createCoupon(payload, token);
      toast.success(res.message || (editing ? "Coupon updated" : "Coupon created"));
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: ApiCoupon) => {
    try {
      const res = await updateCouponStatus(c._id, !c.isActive, token);
      toast.success(res.message || `${c.code} ${c.isActive ? "disabled" : "enabled"}`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (c: ApiCoupon) => {
    try {
      const res = await deleteCoupon(c._id, token);
      toast.success(res.message || "Coupon deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyCode = (c: ApiCoupon) => { navigator.clipboard?.writeText(c.code); toast.success("Code copied"); };

  const columns: Column<ApiCoupon>[] = [
    { key: "code", header: "Code", render: (c) => (
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Ticket className="h-4 w-4" /></div>
        <div>
          <div className="font-mono text-sm font-semibold">{c.code}</div>
          <div className="text-xs text-muted-foreground">{c.title || `Min order ${inr(c.minimumOrderAmount ?? 0)}`}</div>
        </div>
      </div>
    )},
    { key: "value", header: "Discount", render: (c) => (
      <span className="number text-sm font-medium">
        {(c.discountType ?? "").toUpperCase() === "FIXED" ? inr(c.discountValue ?? 0) : `${c.discountValue ?? 0}%`}
      </span>
    )},
    { key: "usage", header: "Usage", render: (c) => {
      const used = c.usedCount ?? 0;
      const limit = c.usageLimit ?? 0;
      const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
      return (
        <div className="min-w-32">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{used.toLocaleString()} used</span>
            <span className="text-muted-foreground">{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }},
    { key: "expires", header: "Expires", render: (c) => (
      <span className="text-xs text-muted-foreground">{c.validUntil ? shortDate(c.validUntil) : "—"}</span>
    )},
    { key: "status", header: "Status", render: (c) => (
      <div className="flex items-center gap-3">
        <StatusBadge label={c.isActive ? "active" : "disabled"} tone={c.isActive ? "success" : "neutral"} />
        <Switch checked={!!c.isActive} onCheckedChange={() => void toggle(c)} />
      </div>
    )},
    { key: "actions", header: "", className: "w-10 text-right", render: (c) => (
      <div onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyCode(c)}><Copy className="h-4 w-4" /> Copy code</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Codes that customers redeem at checkout."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New coupon</Button>
          </div>
        } />

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <EmptyState icon={Ticket} title="Couldn't load coupons" description={error}
          action={<Button size="sm" onClick={() => void load()}>Try again</Button>} />
      ) : (
        <DataTable
          data={coupons}
          columns={columns}
          rowId={(c) => c._id}
          bulkActions={false}
          searchable={(c) => `${c.code} ${c.title ?? ""}`}
          pageSize={10}
          emptyTitle="No coupons yet"
          emptyDescription="Create your first discount code to get started."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit coupon" : "New coupon"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Code</Label><Input className="uppercase font-mono" value={draft.code} onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))} /></div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Save 10%" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={draft.discountType} onValueChange={v => setDraft(d => ({ ...d, discountType: v as Draft["discountType"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PERCENTAGE">Percent %</SelectItem><SelectItem value="FIXED">Flat ₹</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Value</Label><Input type="number" value={draft.discountValue} onChange={e => setDraft(d => ({ ...d, discountValue: Number(e.target.value) }))} /></div>
              {draft.discountType === "PERCENTAGE" && (
                <div className="space-y-1.5"><Label>Max discount (₹)</Label><Input type="number" value={draft.maxDiscount} onChange={e => setDraft(d => ({ ...d, maxDiscount: Number(e.target.value) }))} /></div>
              )}
              <div className="space-y-1.5"><Label>Min order (₹)</Label><Input type="number" value={draft.minimumOrderAmount} onChange={e => setDraft(d => ({ ...d, minimumOrderAmount: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label>Usage limit</Label><Input type="number" value={draft.usageLimit} onChange={e => setDraft(d => ({ ...d, usageLimit: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valid from</Label><Input type="date" value={draft.validFrom} onChange={e => setDraft(d => ({ ...d, validFrom: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Valid until</Label><Input type="date" value={draft.validUntil} onChange={e => setDraft(d => ({ ...d, validUntil: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={v => !v && setToDelete(null)}
        title="Delete coupon?" description={toDelete && <>Customers won't be able to redeem <b>{toDelete.code}</b> anymore.</>}
        confirmLabel="Delete" destructive
        onConfirm={() => { if (toDelete) void remove(toDelete); setToDelete(null); }}
      />
    </div>
  );
}
