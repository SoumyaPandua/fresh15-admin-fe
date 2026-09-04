import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, qs, toList } from "./catalog";
import { useAuth } from "./auth";

export const DELIVERY_STATUSES = [
  "PENDING","ASSIGNED","ACCEPTED","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED","REJECTED","EXPIRED","FAILED","CANCELLED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DeliveryRider = { _id?: string; name?: string; email?: string; phone?: string; role?: string; portal?: string; isActive?: boolean; profileImage?: string; };
export type DeliveryOrderRef = { _id?: string; orderNumber?: string; orderStatus?: string; paymentStatus?: string; paymentMethod?: string; grandTotal?: number; };

export type ApiDelivery = {
  _id: string;
  orderId?: string | DeliveryOrderRef;
  riderId?: string | DeliveryRider | null;
  status?: DeliveryStatus | string;
  riderStatus?: string;
  assignedAt?: string;
  acceptanceDeadlineAt?: string | null;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  estimatedDeliveryTime?: string;
  deliveryOtpVerified?: boolean;
  deliveryOtpVerifiedAt?: string;
  customerConfirmedAt?: string;
  proofOfDelivery?: { photoUrl?: string | null; signatureUrl?: string | null; uploadedAt?: string | null } | null;
  failedDelivery?: { reason?: string | null; note?: string | null; failedAt?: string | null; failedBy?: string | null } | null;
  deliveryCharge?: number;
  earning?: number;
  notes?: string;
  currentLocation?: { latitude?: number | null; longitude?: number | null; updatedAt?: string | null } | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getDeliveries = (params: { search?: string; status?: string; page?: number; limit?: number } = {}, token: string | null) =>
  request<any>(`/api/delivery${qs(params)}`, { method: "GET" }, { token });

export const getAvailableRiders = (token: string | null) =>
  request<any>("/api/delivery/available-riders", { method: "GET" }, { token });

export const getDeliveryById = (id: string, token: string | null) =>
  request<ApiDelivery>(`/api/delivery/${id}`, { method: "GET" }, { token });

export const createDelivery = (orderId: string, token: string | null) =>
  request<ApiDelivery>("/api/delivery", { method: "POST", ...jsonBody({ orderId }) }, { token });

export const assignRider = (id: string, riderId: string, token: string | null) =>
  request<ApiDelivery>(`/api/delivery/${id}/assign`, { method: "PATCH", ...jsonBody({ riderId }) }, { token });

export const setDeliveryStatus = (id: string, status: DeliveryStatus, token: string | null) =>
  request<ApiDelivery>(`/api/delivery/${id}/status`, { method: "PATCH", ...jsonBody({ status }) }, { token });

export const deleteDelivery = (id: string, token: string | null) =>
  request<null>(`/api/delivery/${id}`, { method: "DELETE" }, { token });

export const deliveryOrder = (d: ApiDelivery): DeliveryOrderRef | null =>
  d.orderId && typeof d.orderId === "object" ? d.orderId : null;

export const deliveryOrderId = (d: ApiDelivery) =>
  typeof d.orderId === "string" ? d.orderId : (d.orderId?._id ?? "");

export const deliveryRider = (d: ApiDelivery): DeliveryRider | null =>
  d.riderId && typeof d.riderId === "object" ? d.riderId : null;

export const deliveryRiderId = (d: ApiDelivery) =>
  typeof d.riderId === "string" ? d.riderId : (d.riderId?._id ?? "");

export const deliveryLabel = (s?: string) => (s ?? "").toLowerCase().replace(/_/g, " ") || "unknown";

export const deliveryTone = (s?: string) => {
  switch ((s ?? "").toUpperCase()) {
    case "DELIVERED": return "success";
    case "OUT_FOR_DELIVERY":
    case "PICKED_UP":
    case "ACCEPTED": return "info";
    case "ASSIGNED": return "primary";
    case "PENDING":
    case "EXPIRED": return "warning";
    case "REJECTED":
    case "FAILED":
    case "CANCELLED": return "danger";
    default: return "neutral";
  }
};

export const deliveryStateText = (d: ApiDelivery): string => {
  const rider = deliveryRider(d);
  switch ((d.status ?? "").toUpperCase()) {
    case "PENDING": return "Awaiting rider assignment";
    case "ASSIGNED": return `Assigned to ${rider?.name ?? "rider"} — awaiting acceptance`;
    case "ACCEPTED": return `Accepted by ${rider?.name ?? "rider"}`;
    case "PICKED_UP": return `Picked up by ${rider?.name ?? "rider"}`;
    case "OUT_FOR_DELIVERY": return `Out for delivery with ${rider?.name ?? "rider"}`;
    case "DELIVERED": return "Delivered";
    case "REJECTED": return `Rejected by ${rider?.name ?? "rider"}`;
    case "EXPIRED": return "Rider acceptance expired — awaiting reassignment";
    case "FAILED": return "Delivery failed — requires operational action";
    case "CANCELLED": return "Delivery cancelled";
    default: return deliveryLabel(d.status);
  }
};

export const canAssignRider = (d: ApiDelivery) =>
  ["PENDING","EXPIRED","REJECTED","FAILED"].includes((d.status ?? "").toUpperCase());

export const canAdminCancel = (d: ApiDelivery) =>
  !["DELIVERED","CANCELLED"].includes((d.status ?? "").toUpperCase());

export const orderEligibleForDelivery = (orderStatus?: string) =>
  !["CANCELLED","DELIVERED"].includes((orderStatus ?? "").toUpperCase());

export const deliveryKeys = {
  all: ["deliveries"] as const,
  list: (params: Record<string, unknown> = {}) => ["deliveries", "list", params] as const,
  detail: (id: string) => ["delivery", id] as const,
};

export const isDeliveryAdmin = (role?: string) =>
  ["ADMIN","SUPER_ADMIN","SUPERADMIN","PLATFORM_ADMIN"].includes((role ?? "").toUpperCase());

export function useDeliveries(params: { status?: string; limit?: number } = {}) {
  const { token, user } = useAuth();
  const enabled = !!token && isDeliveryAdmin(user?.role);
  return useQuery({
    queryKey: deliveryKeys.list({ limit: 200, ...params }),
    enabled,
    queryFn: async () => {
      const res = await getDeliveries({ limit: 200, ...params }, token);
      return toList<ApiDelivery>(res.data);
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useRiderAvailability(enabled = true) {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["delivery-rider-availability"],
    enabled: enabled && !!token && isDeliveryAdmin(user?.role),
    queryFn: async () => {
      const res = await getAvailableRiders(token);
      return toList<any>(res.data);
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useDeliveryMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: deliveryKeys.all });
    void qc.invalidateQueries({ queryKey: ["delivery"] });
    void qc.invalidateQueries({ queryKey: ["delivery-rider-availability"] });
    void qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const create = useMutation({
    mutationFn: (orderId: string) => createDelivery(orderId, token),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (v: { id: string; riderId: string }) => assignRider(v.id, v.riderId, token),
    onSuccess: invalidate,
  });
  const status = useMutation({
    mutationFn: (v: { id: string; status: DeliveryStatus }) => setDeliveryStatus(v.id, v.status, token),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteDelivery(id, token),
    onSuccess: invalidate,
  });

  return { create, assign, status, remove };
}
