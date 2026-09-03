import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProductIntelligenceAnalytics } from "@/lib/product-intelligence-api";
import { MousePointerClick, RefreshCw, ShoppingCart, Sparkles, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/product-intelligence")({
  head: () => ({
    meta: [
      { title: "Product Intelligence — Fresh15 Admin" },
      { name: "description", content: "Fresh15 personalization, Smart Basket and offer performance." },
    ],
  }),
  component: ProductIntelligencePage,
});

function ProductIntelligencePage() {
  const query = useProductIntelligenceAnalytics(30);
  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Intelligence"
        description="Measure Smart Basket, personalization and personalized-offer performance."
        actions={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Impressions" value={data?.totals.impressions ?? "—"} icon={<Target className="h-4 w-4" />} />
        <Metric label="Clicks" value={data?.totals.clicks ?? "—"} icon={<MousePointerClick className="h-4 w-4" />} />
        <Metric label="Add to cart" value={data?.totals.addToCart ?? "—"} icon={<ShoppingCart className="h-4 w-4" />} />
        <Metric label="Purchases" value={data?.totals.purchases ?? "—"} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Offer performance</div>
          <div className="mt-1 text-xs text-muted-foreground">CTR and purchases from personalized offer exposure.</div>
          <div className="mt-4 divide-y">
            {(data?.offers ?? []).slice(0, 10).map((offer) => (
              <div key={offer.id} className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-3 py-3">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{offer.name}</div><div className="truncate text-xs text-muted-foreground">{offer.code || "—"}</div></div>
                <div className="text-right text-xs"><div className="font-bold">{offer.ctr}%</div><div className="text-muted-foreground">CTR</div></div>
                <div className="text-right text-xs"><div className="font-bold">{offer.purchases}</div><div className="text-muted-foreground">buy</div></div>
              </div>
            ))}
            {!data?.offers?.length && <div className="py-8 text-center text-sm text-muted-foreground">No offer events yet.</div>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Recommendation performance</div>
          <div className="mt-1 text-xs text-muted-foreground">Products surfaced by personalization and Smart Basket.</div>
          <div className="mt-4 divide-y">
            {(data?.products ?? []).slice(0, 10).map((product) => (
              <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-3 py-3">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{product.name}</div><div className="truncate text-xs text-muted-foreground">{product.code || "—"}</div></div>
                <div className="text-right text-xs"><div className="font-bold">{product.ctr}%</div><div className="text-muted-foreground">CTR</div></div>
                <div className="text-right text-xs"><div className="font-bold">{product.addToCart}</div><div className="text-muted-foreground">cart</div></div>
              </div>
            ))}
            {!data?.products?.length && <div className="py-8 text-center text-sm text-muted-foreground">No recommendation events yet.</div>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-semibold">How Fresh15 ranks today</div>
        <div className="mt-2 text-sm text-muted-foreground">
          First-party purchase history, wishlist, replenishment timing, seasonality, rating, discount and inventory availability are combined with diversity rules. The financial and inventory services remain authoritative.
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div><div className="mt-1 text-2xl font-black">{value}</div></Card>;
}
