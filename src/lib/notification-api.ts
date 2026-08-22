import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, qs, toList } from "./catalog";
import { useAuth } from "./auth";

// ---------------------------------------------------------------------------
// Types — mirror the backend Notification model
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = [
  "GENERAL",
  "ORDER",
  "DELIVERY",
  "PAYMENT",
  "PROMOTION",
  "SYSTEM",
  "BACK_IN_STOCK",
  "PRICE_DROP",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type ApiNotification = {
  _id: string;
  userId?: string | { _id?: string; name?: string; email?: string };
  title?: string;
  message?: string;
  type?: string;
  channel?: string;
  isRead?: boolean;
  readAt?: string;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  metadata?: Record<string, any>;
};

// ---------------------------------------------------------------------------
// Raw API calls
// ---------------------------------------------------------------------------

const getNotifications = (params: { limit?: number } = {}, token?: string | null) =>
  request<any>(`/api/notification${qs(params)}`, { method: "GET" }, { token });

const getUnreadCount = (token?: string | null) =>
  request<any>("/api/notification/unread-count", { method: "GET" }, { token });

const markRead = (id: string, token?: string | null) =>
  request<any>(`/api/notification/${id}/read`, { method: "PATCH" }, { token });

const markAllRead = (token?: string | null) =>
  request<any>("/api/notification/read-all", { method: "PATCH" }, { token });

const removeNotification = (id: string, token?: string | null) =>
  request<any>(`/api/notification/${id}`, { method: "DELETE" }, { token });

const createNotification = (input: CreateNotificationInput, token?: string | null) =>
  request<ApiNotification>("/api/notification", { method: "POST", ...jsonBody(input) }, { token });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function unreadFromPayload(data: any): number {
  if (typeof data === "number") return data;
  if (!data || typeof data !== "object") return 0;
  for (const k of ["unreadCount", "count", "unread", "total"]) {
    if (typeof data[k] === "number") return data[k];
  }
  return 0;
}

/** Derive an in-app link from metadata when the backend provides one. */
export function notificationLink(n: ApiNotification): string | undefined {
  const m = n.metadata || {};
  if (m.deliveryId) return "/deliveries";
  if (m.orderId) return "/orders";
  const t = (n.type || "").toUpperCase();
  if (t === "ORDER") return "/orders";
  if (t === "DELIVERY") return "/deliveries";
  if (t === "PAYMENT") return "/payments/razorpay";
  return undefined;
}

export const isNotificationAdmin = (role?: string) =>
  ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes((role || "").toUpperCase());

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (p: Record<string, unknown>) => ["notifications", "list", p] as const,
  unread: ["notifications", "unread-count"] as const,
};

export function useNotifications(params: { limit?: number } = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.list(params),
    enabled: !!token,
    queryFn: async () => {
      const res = await getNotifications({ limit: 100, ...params }, token);
      return toList<ApiNotification>(res.data);
    },
  });
}

export function useUnreadCount() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unread,
    enabled: !!token,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await getUnreadCount(token);
      return unreadFromPayload(res.data);
    },
  });
}

export function useNotificationMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.all });
  };

  const read = useMutation({ mutationFn: (id: string) => markRead(id, token), onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: () => markAllRead(token), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => removeNotification(id, token), onSuccess: invalidate });
  const create = useMutation({
    mutationFn: (input: CreateNotificationInput) => createNotification(input, token),
    onSuccess: invalidate,
  });

  return { read, readAll, remove, create };
}
