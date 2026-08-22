"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Eye, EyeOff, Trash2, MessageSquare, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { shortDate } from "@/lib/format";
import { useReviews, useReviewMutations, reviewProduct, reviewUser, type ApiReview } from "@/lib/review-api";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Product Reviews — Fresh15 Admin" },
      { name: "description", content: "Moderate customer product reviews, ratings and visibility across Fresh15." },
      { property: "og:title", content: "Product Reviews — Fresh15 Admin" },
      { property: "og:description", content: "Moderate customer product reviews, ratings and visibility across Fresh15." },
    ],
  }),
  component: ReviewsPage,
});

function Stars({ value = 0 }: { value?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={i <= Math.round(value) ? "h-3.5 w-3.5 fill-[color:var(--warning)] text-[color:var(--warning)]" : "h-3.5 w-3.5 text-muted-foreground/40"} />
      ))}
      <span className="number ml-1 text-xs font-medium">{value?.toFixed?.(1) ?? value}</span>
    </span>
  );
}

function ReviewsPage() {
  const { data: reviews = [], isLoading, isError, error } = useReviews();
  const { setVisibility, remove } = useReviewMutations();
  const [rating, setRating] = useState("all");
  const [visibility, setVis] = useState("all");
  const [toDelete, setToDelete] = useState<ApiReview | null>(null);

  const filtered = useMemo(() => reviews.filter(r => {
    if (rating !== "all" && Math.round(r.rating || 0) !== Number(rating)) return false;
    if (visibility === "visible" && r.isVisible === false) return false;
    if (visibility === "hidden" && r.isVisible !== false) return false;
    return true;
  }), [reviews, rating, visibility]);

  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const hidden = reviews.filter(r => r.isVisible === false).length;
  const verified = reviews.filter(r => r.verifiedPurchase).length;

  const columns: Column<ApiReview>[] = [
    {
      key: "product", header: "Product",
      accessor: r => reviewProduct(r).name || "",
      sortable: true,
      render: r => {
        const p = reviewProduct(r);
        return (
          <div className="flex items-center gap-3">
            {p.images?.[0]
              ? <img src={p.images[0]} alt={p.name || "Product"} className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
              : <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><MessageSquare className="h-4 w-4" /></div>}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{p.name || "Unknown product"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{p.totalReviews ?? 0} reviews · avg {(p.averageRating ?? 0).toFixed(1)}</div>
            </div>
          </div>
        );
      },
    },
    { key: "rating", header: "Rating", sortable: true, accessor: r => r.rating || 0, render: r => <Stars value={r.rating || 0} /> },
    {
      key: "review", header: "Review",
      render: r => (
        <div className="max-w-[320px]">
          {r.title && <div className="truncate text-sm font-medium">{r.title}</div>}
          <div className="line-clamp-2 text-xs text-muted-foreground">{r.comment}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">by {reviewUser(r).name || reviewUser(r)._id || "Customer"}</div>
        </div>
      ),
    },
    {
      key: "verified", header: "Verified",
      render: r => r.verifiedPurchase
        ? <StatusBadge label="Verified purchase" tone="success" dot={false} />
        : <StatusBadge label="Unverified" tone="neutral" dot={false} />,
    },
    {
      key: "visible", header: "Visibility",
      render: r => <StatusBadge label={r.isVisible === false ? "Hidden" : "Visible"} tone={r.isVisible === false ? "danger" : "info"} />,
    },
    { key: "date", header: "Date", sortable: true, accessor: r => r.createdAt || "", render: r => <span className="text-xs text-muted-foreground">{r.createdAt ? shortDate(r.createdAt) : "—"}</span> },
    {
      key: "actions", header: "", className: "text-right",
      render: r => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            title={r.isVisible === false ? "Show review" : "Hide review"}
            disabled={setVisibility.isPending}
            onClick={e => {
              e.stopPropagation();
              setVisibility.mutate({ id: r._id, isVisible: r.isVisible === false }, {
                onSuccess: () => toast.success(r.isVisible === false ? "Review is now visible" : "Review hidden"),
                onError: (err: any) => toast.error(err?.message || "Could not update review visibility"),
              });
            }}
          >
            {r.isVisible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete review"
            onClick={e => { e.stopPropagation(); setToDelete(r); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Product Reviews" description="Moderate customer ratings and reviews across the catalog." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reviews" value={String(total)} icon={MessageSquare} />
        <StatCard label="Average rating" value={avg.toFixed(1)} icon={Star} />
        <StatCard label="Verified purchases" value={String(verified)} icon={BadgeCheck} />
        <StatCard label="Hidden" value={String(hidden)} icon={EyeOff} />
      </div>

      {isLoading ? (
        <Card className="p-5"><LoadingSkeleton rows={8} /></Card>
      ) : isError ? (
        <Card className="p-5">
          <EmptyState icon={MessageSquare} title="Could not load reviews" description={(error as Error)?.message || "Please try again."} />
        </Card>
      ) : (
        <Card className="p-0 gap-0 overflow-hidden">
          <div className="p-4">
            <DataTable
              data={filtered}
              columns={columns}
              rowId={r => r._id}
              bulkActions={false}
              searchable={r => `${reviewProduct(r).name || ""} ${r.title || ""} ${r.comment || ""} ${reviewUser(r).name || ""}`}
              emptyTitle="No reviews found"
              emptyDescription="Reviews left by customers will appear here."
              filters={
                <>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rating" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ratings</SelectItem>
                      {[5, 4, 3, 2, 1].map(n => <SelectItem key={n} value={String(n)}>{n} star{n > 1 ? "s" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={visibility} onValueChange={setVis}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Visibility" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All reviews</SelectItem>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={v => !v && setToDelete(null)}
        title="Delete review?"
        description="This permanently removes the review and updates the product rating."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (toDelete) {
            remove.mutate(toDelete._id, {
              onSuccess: () => toast.success("Review deleted"),
              onError: (e: any) => toast.error(e?.message || "Could not delete review"),
            });
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
