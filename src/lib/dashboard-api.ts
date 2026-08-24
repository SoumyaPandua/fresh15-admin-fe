import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type DashboardOrder = {
  _id: string;
  orderNumber?: string;
  grandTotal?: number;
  orderStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    profileImage?: string;
  } | null;
  items?: unknown[];
};

export type DashboardProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
  image: string;
};

export type DashboardResponse = {
  overview: {
    totalUsers: number;
    activeCustomers: number;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    totalOrders: number;
    pendingOrders: number;
    liveOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    activePartners: number;
    totalPartners: number;
    todayRevenue: number;
  };
  revenueSeries: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  categoryMix: {
    name: string;
    value: number;
  }[];
  hourlyOrders: {
    hour: string;
    orders: number;
  }[];
  latestOrders: DashboardOrder[];
  topSellingProducts: DashboardProduct[];
  lowStockProducts: unknown[];
};

export async function getAdminDashboard(token: string | null) {
  const response = await request<DashboardResponse>(
    "/api/dashboard/admin",
    { method: "GET" },
    { token },
  );

  return response.data;
}

export function useAdminDashboard() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: ["admin-dashboard"],
    enabled: !!token && ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes(
      (user?.role ?? "").toUpperCase(),
    ),
    queryFn: () => getAdminDashboard(token),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
