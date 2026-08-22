import { useQuery } from "@tanstack/react-query";
import { request, qs } from "./catalog";
import { useAuth } from "./auth";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ReportCustomer = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
};

export type ReportPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReportQuery = {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
};

// ---------------------------------------------------------------------------
// COD report
// ---------------------------------------------------------------------------

export type CodSummary = {
  codOrders: number;
  collected: number;
  pending: number;
  failed: number;
  averageCodTicket: number;
};

export type CodOrder = {
  id: string;
  orderNumber?: string;
  customer?: ReportCustomer;
  amount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  placedAt?: string;
  collectedAt?: string | null;
  deliveryPartner?: { id?: string; name?: string; phone?: string } | null;
  deliveryStatus?: string;
};

export type CodReport = {
  summary: CodSummary;
  orders: CodOrder[];
  pagination: ReportPagination;
};

const emptyPagination: ReportPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export const fetchCodReport = async (params: ReportQuery, token?: string | null): Promise<CodReport> => {
  const res = await request<any>(`/api/payment/admin/cod-report${qs(params as any)}`, { method: "GET" }, { token });
  const d = res.data || {};
  return {
    summary: d.summary ?? { codOrders: 0, collected: 0, pending: 0, failed: 0, averageCodTicket: 0 },
    orders: Array.isArray(d.orders) ? d.orders : [],
    pagination: d.pagination ?? emptyPagination,
  };
};

export function useCodReport(params: ReportQuery) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["payments", "cod-report", params],
    enabled: !!token,
    queryFn: () => fetchCodReport(params, token),
    placeholderData: (prev) => prev,
  });
}

// ---------------------------------------------------------------------------
// Razorpay report
// ---------------------------------------------------------------------------

export type RazorpaySummary = {
  totalTransactions: number;
  successful: number;
  pending: number;
  failed: number;
  totalAmount: number;
  averageTransaction: number;
};

export type RazorpayOrder = {
  id: string;
  orderNumber?: string;
  customer?: ReportCustomer;
  amount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  gatewayAmount?: number;
  currency?: string;
  gatewayStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RazorpayReport = {
  summary: RazorpaySummary;
  orders: RazorpayOrder[];
  pagination: ReportPagination;
};

export const fetchRazorpayReport = async (params: ReportQuery, token?: string | null): Promise<RazorpayReport> => {
  const res = await request<any>(`/api/payment/admin/razorpay-report${qs(params as any)}`, { method: "GET" }, { token });
  const d = res.data || {};
  return {
    summary: d.summary ?? {
      totalTransactions: 0, successful: 0, pending: 0, failed: 0, totalAmount: 0, averageTransaction: 0,
    },
    orders: Array.isArray(d.orders) ? d.orders : [],
    pagination: d.pagination ?? emptyPagination,
  };
};

export function useRazorpayReport(params: ReportQuery) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["payments", "razorpay-report", params],
    enabled: !!token,
    queryFn: () => fetchRazorpayReport(params, token),
    placeholderData: (prev) => prev,
  });
}
