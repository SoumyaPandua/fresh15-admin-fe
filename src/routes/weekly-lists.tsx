"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useAdminGroceryListSummary, useAdminGroceryLists, type AdminGroceryList } from "@/lib/grocery-list-api";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Pin, RefreshCw, ShoppingBasket, Users } from "lucide-react";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/weekly-lists")({
  head: () => ({ meta: [{ title: "Weekly Lists — Fresh15 Admin" }, { name: "description", content: "Monitor saved weekly grocery baskets and recurring customer demand." }] }),
  component: WeeklyListsPage,
});

const userOf = (row: AdminGroceryList) => typeof row.userId === "object" && row.userId ? row.userId : null;

function WeeklyListsPage() {
  const summary = useAdminGroceryListSummary();
  const lists = useAdminGroceryLists();
  const columns: Column<AdminGroceryList>[] = [
    { key: "name", header: "Basket", render: (row) => <div><div className="text-sm font-semibold">{row.name}</div><div className="text-xs text-muted-foreground">{row.items?.length ?? 0} items</div></div> },
    { key: "customer", header: "Customer", render: (row) => { const user = userOf(row); return <div><div className="text-sm font-medium">{user?.name ?? "Customer"}</div><div className="text-xs text-muted-foreground">{user?.email ?? "—"}</div></div>; } },
    { key: "type", header: "Type", render: (row) => <div className="flex gap-1.5">{row.listType === "WEEKLY_ESSENTIALS" && <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10"><CalendarClock className="h-3 w-3" /> Weekly</Badge>}{row.isPinned && <Badge variant="outline" className="gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}</div> },
    { key: "updated", header: "Updated", render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
  ];
  return <div className="space-y-6">
    <PageHeader title="Weekly Lists" description="See how customers are turning their routines into reusable grocery baskets." actions={<Button variant="outline" size="sm" onClick={() => { void summary.refetch(); void lists.refetch(); }} disabled={summary.isFetching || lists.isFetching}><RefreshCw className="h-4 w-4" /> Refresh</Button>} />
    {summary.isLoading ? <div className="grid gap-4 sm:grid-cols-4"><LoadingSkeleton rows={1} /><LoadingSkeleton rows={1} /><LoadingSkeleton rows={1} /><LoadingSkeleton rows={1} /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Saved baskets" value={String(summary.data?.totalLists ?? 0)} icon={ShoppingBasket} /><StatCard label="Weekly Essentials" value={String(summary.data?.weeklyLists ?? 0)} icon={CalendarClock} tone="success" /><StatCard label="Pinned baskets" value={String(summary.data?.pinnedLists ?? 0)} icon={Pin} tone="warning" /><StatCard label="Saved product lines" value={String(summary.data?.totalItems ?? 0)} icon={Users} /></div>}
    {summary.data?.topProducts?.length ? <div className="rounded-2xl border bg-card p-4"><div className="mb-3 text-sm font-semibold">Most saved products</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{summary.data.topProducts.slice(0, 8).map((product) => <div key={product.productId} className="flex items-center gap-3 rounded-xl border p-3">{product.image ? <img src={product.image} alt={product.name ?? ""} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted" />}<div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{product.name ?? "Product"}</div><div className="text-[11px] text-muted-foreground">Saved in {product.lists} basket{product.lists === 1 ? "" : "s"} · {inr(Number(product.sellingPrice ?? 0))}</div></div></div>)}</div></div> : null}
    {lists.isLoading ? <LoadingSkeleton rows={8} /> : lists.isError ? <EmptyState title="Couldn't load weekly lists" description={lists.error instanceof Error ? lists.error.message : "Please try again."} action={<Button size="sm" onClick={() => void lists.refetch()}>Try again</Button>} /> : <DataTable data={lists.data ?? []} columns={columns} pageSize={12} rowId={(row) => row._id} searchable={(row) => { const user = userOf(row); return `${row.name} ${user?.name ?? ""} ${user?.email ?? ""}`; }} emptyTitle="No saved baskets yet" emptyDescription="Customer weekly baskets will appear here." />}
  </div>;
}
