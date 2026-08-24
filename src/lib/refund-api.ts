import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, qs } from "./catalog";
import { useAuth } from "./auth";

export type RefundStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "REJECTED"
  | "MANUAL_REQUIRED"
  | "REVERSED";

export type AdminRefund = {
  _id: string;
  amount: number;
  currency?: string;
  reason: string;
  status: RefundStatus;
  razorpayRefundId?: string | null;
  rejectionReason?: string;
  manualReference?: string;
  createdAt: string;
  processedAt?: string | null;
  orderId?: {
    _id: string;
    orderNumber?: string;
    grandTotal?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    orderStatus?: string;
  } | null;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  processedBy?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
};

export type AdminRefundResponse = {
  items: AdminRefund[];
  summary: Record<string, { count: number; amount: number }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type RefundQuery = {
  page?: number;
  limit?: number;
  status?: RefundStatus | "";
  search?: string;
};

export async function fetchAdminRefunds(
  params: RefundQuery,
  token: string | null,
) {
  const response = await request<AdminRefundResponse>(
    `/api/refund/admin${qs(params as any)}`,
    { method: "GET" },
    { token },
  );

  return response.data;
}

export function useAdminRefunds(params: RefundQuery) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["refunds", "admin", params],
    enabled: Boolean(token),
    queryFn: () => fetchAdminRefunds(params, token),
    placeholderData: (previous) => previous,
  });
}

export function useProcessRefund() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      const response = await request<AdminRefund>(
        `/api/refund/admin/${refundId}/process`,
        { method: "POST" },
        { token },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["refunds", "admin"] });
    },
  });
}

export function useRejectRefund() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refundId,
      reason,
    }: {
      refundId: string;
      reason: string;
    }) => {
      const response = await request<AdminRefund>(
        `/api/refund/admin/${refundId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
        { token },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["refunds", "admin"] });
    },
  });
}

export function useCompleteManualRefund() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refundId,
      reference,
    }: {
      refundId: string;
      reference: string;
    }) => {
      const response = await request<AdminRefund>(
        `/api/refund/admin/${refundId}/manual-complete`,
        {
          method: "POST",
          body: JSON.stringify({ reference }),
        },
        { token },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["refunds", "admin"] });
    },
  });
}
