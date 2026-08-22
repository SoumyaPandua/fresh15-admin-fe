"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { inr, shortDate } from "@/lib/format";
import {
  useCustomers,
  useCustomerSummary,
  useCustomerMutations,
  customerOrders,
  customerSpent,
  customerCity,
  customerAvatar,
  TIERS,
  type ApiCustomer,
} from "@/lib/customer-api";
import { Users, UserPlus, Crown, Ban, MoreHorizontal, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Fresh15 Admin" },
      { name: "description", content: "Manage the Fresh15 customer base." },
      { property: "og:title", content: "Customers — Fresh15 Admin" },
      { property: "og:description", content: "Manage the Fresh15 customer base." },
    ],
  }),
  component: CustomersPage,
});

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

function CustomersPage() {
  const { data: customers = [], isLoading, isError, error } = useCustomers();
  const { data: summary } = useCustomerSummary();
  const { create, setStatus, setTier, remove } = useCustomerMutations();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", password: "" });
  const [toDelete, setToDelete] = useState<ApiCustomer | null>(null);

  const total = customers.length;

  const active = customers.filter((customer) => customer.isActive === true || customer.status === "active").length;

  const inactive = customers.filter((customer) => customer.isActive === false || customer.status === "inactive").length;

  const totalSpent = customers.reduce((sum, customer) => sum + customerSpent(customer), 0);

  const save = async () => {
    if (!draft.name || !draft.email || !draft.password) {
      toast.error("Name, email and password are required");
      return;
    }
    try {
      const res = await create.mutateAsync({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        password: draft.password,
      });
      toast.success(res.message || "Customer added");
      setDraft({ name: "", email: "", phone: "", password: "" });
      setOpen(false);
    } catch (e) {
      toast.error(errMsg(e, "Unable to add customer"));
    }
  };

  const changeStatus = async (c: ApiCustomer, isActive: boolean) => {
    try {
      const res = await setStatus.mutateAsync({ id: c.id, isActive });
      toast.success(res.message || (isActive ? "Customer activated" : "Customer deactivated"));
    } catch (e) {
      toast.error(errMsg(e, "Unable to update status"));
    }
  };

  const changeTier = async (c: ApiCustomer, tier: string) => {
    try {
      const res = await setTier.mutateAsync({ id: c.id, tier });
      toast.success(res.message || `Tier set to ${tier}`);
    } catch (e) {
      toast.error(errMsg(e, "Unable to update tier"));
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await remove.mutateAsync(toDelete.id);
      toast.success(res.message || "Customer deleted");
    } catch (e) {
      toast.error(errMsg(e, "Unable to delete customer"));
    }
    setToDelete(null);
  };

  const columns: Column<ApiCustomer>[] = [
    {
      key: "name",
      header: "Customer",
      accessor: (c) => c.name || "",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <img src={customerAvatar(c)} className="h-9 w-9 rounded-full object-cover" alt="" loading="lazy" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{c.name || "Unnamed"}</div>
            <div className="truncate text-xs text-muted-foreground">{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => <span className="number text-sm">{c.phone || "—"}</span> },
    { key: "city", header: "City", render: (c) => <span className="text-sm">{customerCity(c) || "—"}</span> },
    {
      key: "orders",
      header: "Orders",
      accessor: (c) => customerOrders(c),
      sortable: true,
      render: (c) => <span className="number text-sm">{customerOrders(c)}</span>,
    },
    {
      key: "spent",
      header: "Lifetime value",
      accessor: (c) => customerSpent(c),
      sortable: true,
      render: (c) => <span className="number text-sm font-semibold">{inr(customerSpent(c))}</span>,
    },
    {
      key: "tier",
      header: "Tier",
      accessor: (c) => c.tier || "",
      sortable: true,
      render: (c) => (
        <StatusBadge
          label={(c.tier || "—").toUpperCase()}
          tone={c.tier === "GOLD" || c.tier === "PLATINUM" ? "primary" : "neutral"}
        />
      ),
    },
    {
      key: "joined",
      header: "Joined",
      accessor: (c) => c.joined || "",
      sortable: true,
      render: (c) => <span className="text-xs text-muted-foreground">{c.joined ? shortDate(c.joined) : "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusBadge
          label={c.isActive === false ? "INACTIVE" : "ACTIVE"}
          tone={c.isActive === false ? "neutral" : "success"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10 text-right",
      render: (c) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIERS.map((t) => (
                <DropdownMenuItem key={t} onClick={() => changeTier(c, t)}>
                  <Crown className="h-4 w-4" /> Set {t.charAt(0) + t.slice(1).toLowerCase()}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {c.isActive === false ? (
                <DropdownMenuItem onClick={() => changeStatus(c, true)}>
                  <ShieldCheck className="h-4 w-4" /> Activate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => changeStatus(c, false)}>
                  <ShieldOff className="h-4 w-4" /> Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(c)}>
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
        title="Customers"
        description="Everyone who has ordered from Fresh15."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add customer
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={String(total)} icon={Users} />
        <StatCard label="Active customers" value={String(active)} icon={Crown} tone="success" />
        <StatCard label="Inactive" value={String(inactive)} icon={Ban} tone="warning" />
        <StatCard label="Lifetime value" value={inr(totalSpent)} icon={Users} tone="info" />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : isError ? (
        <EmptyState icon={Users} title="Unable to load customers" description={errMsg(error, "Please try again.")} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers who sign up on the storefront will appear here."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add customer
            </Button>
          }
        />
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          pageSize={12}
          searchable={(c) => `${c.name ?? ""} ${c.email ?? ""} ${customerCity(c)} ${c.phone ?? ""}`}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete customer?"
        description={
          toDelete && (
            <>
              This will permanently remove <b>{toDelete.name}</b>.
            </>
          )
        }
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}
