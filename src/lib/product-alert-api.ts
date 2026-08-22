import { useQuery } from "@tanstack/react-query";
import { request, qs, toList, type ApiResponse } from "./catalog";
import { useAuth } from "./auth";

export type ApiProductAlert = {
  _id: string;
  userId?: string | { _id?: string; name?: string; email?: string; phone?: string };
  productId?:
    | string
    | {
        _id: string;
        name?: string;
        images?: string[];
        sellingPrice?: number;
        mrp?: number;
        stock?: number;
        unit?: string;
        sku?: string;
      };
  backInStock?: boolean;
  priceDrop?: boolean;
  targetPrice?: number | null;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  lastNotifiedPrice?: number | null;
  lastPriceDropNotifiedAt?: string | null;
  backInStockNotifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductAlertSummary = {
  total: number;
  backInStock: number;
  priceDrop: number;
  topProducts: Array<{
    productId: string;
    name?: string;
    image?: string;
    sellingPrice?: number;
    stock?: number;
    subscribers: number;
    backInStockSubscribers: number;
    priceDropSubscribers: number;
  }>;
};

export async function getAdminProductAlerts(
  params: {
    type?: "BACK_IN_STOCK" | "PRICE_DROP";
    productId?: string;
    page?: number;
    limit?: number;
  } = {},
  token: string | null,
) {
  return request<ApiProductAlert[] | { items?: ApiProductAlert[]; pagination?: unknown }>(
    `/api/product-alerts/admin${qs(params)}`,
    { method: "GET" },
    { token },
  );
}

export async function getAdminProductAlertSummary(
  token: string | null,
) {
  return request<ProductAlertSummary>(
    "/api/product-alerts/admin/summary",
    { method: "GET" },
    { token },
  );
}

export function useAdminProductAlerts(params: {
  type?: "BACK_IN_STOCK" | "PRICE_DROP";
  limit?: number;
} = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["admin-product-alerts", params],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await getAdminProductAlerts(
        { limit: 200, ...params },
        token,
      );
      return toList<ApiProductAlert>(response.data);
    },
    staleTime: 30_000,
  });
}

export function useAdminProductAlertSummary() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["admin-product-alerts", "summary"],
    enabled: Boolean(token),
    queryFn: async () => {
      const response =
        await getAdminProductAlertSummary(token);
      return response.data;
    },
    staleTime: 30_000,
  });
}
