import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type AnalyticsData = {
  overview: {
    mrr: number;
    newCustomers: number;
    repeatRate: number;
    ordersPerCustomer: number;
    totalCustomers: number;
    totalOrders: number;
    conversion: number;
  };
  revenueSeries: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  weeklyRetention: {
    week: string;
    rate: number;
  }[];
  hourlyOrders: {
    hour: string;
    orders: number;
  }[];
  categoryMix: {
    name: string;
    value: number;
    revenue: number;
  }[];
};

export async function getAdminAnalytics(token: string | null) {
  const response = await request<AnalyticsData>(
    "/api/dashboard/admin/analytics",
    { method: "GET" },
    { token },
  );

  return response.data;
}

export function useAdminAnalytics() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: ["admin-analytics"],
    enabled:
      !!token &&
      ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes(
        (user?.role ?? "").toUpperCase(),
      ),
    queryFn: () => getAdminAnalytics(token),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
