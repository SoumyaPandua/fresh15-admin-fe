import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, qs, toList } from "./catalog";
import { useAuth } from "./auth";

// ---------------------------------------------------------------------------
// Types — mirror the backend Delivery model (fields are optional because the
// backend only populates them as the lifecycle progresses).
// ---------------------------------------------------------------------------

export const DELIVERY_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
  "FAILED",
  "CANCELLED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DeliveryRider = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  portal?: string;
  isActive?: boolean;
  profileImage?: string;
};

export type DeliveryOrderRef = {
  _id?: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  grandTotal?: number;
};

export type ApiDelivery = {
  _id: string;
  orderId?: string | DeliveryOrderRef;
  riderId?: string | DeliveryRider | null;
  status?: DeliveryStatus | string;
  riderStatus?: string;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  estimatedDeliveryTime?: string;
  deliveryOtpVerified?: boolean;
  deliveryOtpVerifiedAt?: string;
  customerConfirmedAt?: string;
  proofOfDelivery?: {
    photoUrl?: string | null;
    signatureUrl?: string | null;
    uploadedAt?: string | null;
  } | null;
  failedDelivery?: {
    reason?: string | null;
    note?: string | null;
    failedAt?: string | null;
    failedBy?: string | null;
  } | null;
  deliveryCharge?: number;
  earning?: number;
  notes?: string;
  currentLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    updatedAt?: string | null;
  } | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Raw API calls — reuse the shared authenticated request helper.
// ---------------------------------------------------------------------------

export const getDeliveries = (
  params: { search?: string; status?: string; page?: number; limit?: number } = {},
  token: string | null,
) => request<any>(`/api/delivery${qs(params)}`, { method: "GET" }, { token });

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

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

export const deliveryOrder = (d: ApiDelivery): DeliveryOrderRef | null =>
  d.orderId && typeof d.orderId === "object" ? (d.orderId as DeliveryOrderRef) : null;

export const deliveryOrderId = (d: ApiDelivery): string =>
  typeof d.orderId === "string" ? d.orderId : (d.orderId?._id ?? "");

export const deliveryRider = (d: ApiDelivery): DeliveryRider | null =>
  d.riderId && typeof d.riderId === "object" ? (d.riderId as DeliveryRider) : null;

export const deliveryRiderId = (d: ApiDelivery): string =>
  typeof d.riderId === "string" ? d.riderId : (d.riderId?._id ?? "");

export const deliveryLabel = (s?: string) => (s ?? "").toLowerCase().replace(/_/g, " ") || "unknown";

export const deliveryTone = (s?: string) => {
  switch ((s ?? "").toUpperCase()) {
    case "DELIVERED":
      return "success";
    case "OUT_FOR_DELIVERY":
    case "PICKED_UP":
    case "ACCEPTED":
      return "info";
    case "ASSIGNED":
      return "primary";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
};

/** Human-readable state line used in Order details. */
export const deliveryStateText = (d: ApiDelivery): string => {
  const rider = deliveryRider(d);
  switch ((d.status ?? "").toUpperCase()) {
    case "PENDING":
      return "Awaiting rider assignment";
    case "ASSIGNED":
      return `Assigned to ${rider?.name ?? "rider"} — awaiting acceptance`;
    case "ACCEPTED":
      return `Accepted by ${rider?.name ?? "rider"}`;
    case "PICKED_UP":
      return `Picked up by ${rider?.name ?? "rider"}`;
    case "OUT_FOR_DELIVERY":
      return `Out for delivery with ${rider?.name ?? "rider"}`;
    case "DELIVERED":
      return "Delivered";
    case "REJECTED":
      return `Rejected by ${rider?.name ?? "rider"}`;
    case "CANCELLED":
      return "Delivery cancelled";
    default:
      return deliveryLabel(d.status);
  }
};

/** A rider can be (re)assigned unless the delivery is already finished. */
export const canAssignRider = (d: ApiDelivery) => !["DELIVERED", "CANCELLED"].includes((d.status ?? "").toUpperCase());

/** Admin may cancel while the delivery has not been completed. */
export const canAdminCancel = (d: ApiDelivery) => !["DELIVERED", "CANCELLED"].includes((d.status ?? "").toUpperCase());

/** Orders eligible for a delivery record — not cancelled, not already delivered. */
export const orderEligibleForDelivery = (orderStatus?: string) =>
  !["CANCELLED", "DELIVERED"].includes((orderStatus ?? "").toUpperCase());

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export const deliveryKeys = {
  all: ["deliveries"] as const,
  list: (params: Record<string, unknown> = {}) => ["deliveries", "list", params] as const,
  detail: (id: string) => ["delivery", id] as const,
};

/** Only admins may administer deliveries (backend enforces this too). */
export const isDeliveryAdmin = (role?: string) =>
  ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes((role ?? "").toUpperCase());

export function useDeliveries(params: { status?: string; limit?: number } = {}) {
  const { token, user } = useAuth();
  const enabled = !!token && isDeliveryAdmin(user?.role);
  return useQuery({
    queryKey: deliveryKeys.list(params),
    enabled,
    queryFn: async () => {
      const res = await getDeliveries({ limit: 200, ...params }, token);
      return toList<ApiDelivery>(res.data);
    },
  });
}

export function useDeliveryMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: deliveryKeys.all });
    void qc.invalidateQueries({ queryKey: ["delivery"] });
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
