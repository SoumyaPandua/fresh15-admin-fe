import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type ProductIntelligenceAnalytics = {
  days: number;
  totals: {
    impressions: number;
    clicks: number;
    addToCart: number;
    purchases: number;
    dismissals: number;
  };
  offers: Array<{
    id: string;
    name: string;
    code?: string | null;
    kind: "OFFER";
    impressions: number;
    clicks: number;
    addToCart: number;
    purchases: number;
    ctr: number;
    totalEvents: number;
  }>;
  products: Array<{
    id: string;
    name: string;
    code?: string | null;
    kind: "PRODUCT";
    impressions: number;
    clicks: number;
    addToCart: number;
    purchases: number;
    ctr: number;
    totalEvents: number;
  }>;
};

export async function getProductIntelligenceAnalytics(token: string | null, days = 30) {
  return (await request<ProductIntelligenceAnalytics>(`/api/recommendations/admin/analytics?days=${days}`, { method: "GET" }, { token })).data;
}

export function useProductIntelligenceAnalytics(days = 30) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["product-intelligence-analytics", days],
    enabled: Boolean(token),
    queryFn: () => getProductIntelligenceAnalytics(token, days),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}
