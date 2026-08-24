import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type RevenueData = {
  overview: {
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    aov: number;
    totalOrders: number;
  };
  revenueSeries: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  categoryMix: {
    name: string;
    value: number;
    revenue: number;
  }[];
};

export async function getAdminRevenue(token: string | null) {
  const response = await request<RevenueData>(
    "/api/dashboard/admin/revenue",
    { method: "GET" },
    { token },
  );

  return response.data;
}

export function useAdminRevenue() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: ["admin-revenue"],
    enabled: !!token && ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes(
      (user?.role ?? "").toUpperCase(),
    ),
    queryFn: () => getAdminRevenue(token),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
