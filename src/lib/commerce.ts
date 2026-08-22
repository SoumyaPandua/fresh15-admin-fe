import { request, jsonBody, qs, toList } from "./catalog";

export { toList };

export type ApiCoupon = {
  _id: string;
  code: string;
  title?: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FIXED" | string;
  discountValue?: number;
  maxDiscount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
};

export type CouponInput = {
  code: string;
  title: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount?: number;
  minimumOrderAmount: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
};

export const getCoupons = (params: { search?: string; page?: number; limit?: number } = {}, token: string | null) =>
  request<any>(`/api/coupon${qs(params)}`, { method: "GET" }, { token });

export const getCouponById = (id: string, token: string | null) =>
  request<ApiCoupon>(`/api/coupon/${id}`, { method: "GET" }, { token });

export const createCoupon = (input: CouponInput, token: string | null) =>
  request<ApiCoupon>("/api/coupon", { method: "POST", ...jsonBody(input) }, { token });

export const updateCoupon = (id: string, input: CouponInput, token: string | null) =>
  request<ApiCoupon>(`/api/coupon/${id}`, { method: "PUT", ...jsonBody(input) }, { token });

export const updateCouponStatus = (id: string, isActive: boolean, token: string | null) =>
  request<ApiCoupon>(`/api/coupon/${id}/status`, { method: "PATCH", ...jsonBody({ isActive }) }, { token });

export const deleteCoupon = (id: string, token: string | null) =>
  request<null>(`/api/coupon/${id}`, { method: "DELETE" }, { token });

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type ApiOrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderGroup = "pending" | "live" | "completed" | "cancelled";

export const orderGroup = (s?: string): OrderGroup => {
  const v = (s ?? "").toUpperCase();
  if (v === "DELIVERED") return "completed";
  if (v === "CANCELLED") return "cancelled";
  if (v === "PENDING") return "pending";
  return "live";
};

export type ApiOrderCustomer = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
};

export type ApiOrderAddress = {
  _id?: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  address?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
};

export const SUBSTITUTION_PREFERENCES = ["CALL_ME", "BEST_SIMILAR", "DO_NOT_SUBSTITUTE", "SPECIFIC_PRODUCT"] as const;
export type SubstitutionPreference = (typeof SUBSTITUTION_PREFERENCES)[number];

export type ApiProductRef = {
  _id?: string;
  name?: string;
  images?: string[];
  image?: string;
  unit?: string;
};

export type ApiSubstitutionPreference = {
  type?: string | null;
  preferredReplacementProductId?: string | ApiProductRef | null;
  preferredReplacementProductName?: string | null;
  preferredReplacementSku?: string | null;
  preferredReplacementImage?: string | null;
};

export type ApiOrderItem = {
  _id?: string;
  productId?: string | ApiProductRef;
  name?: string;
  productName?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unitPrice?: number;
  total?: number;
  substitutionPreference?: SubstitutionPreference | string | ApiSubstitutionPreference | null;
  preferredReplacementProductId?: string | ApiProductRef | null;
  replacementProduct?: ApiProductRef | null;
};

export type ApiOrder = {
  _id: string;
  orderNumber?: string;
  userId?: string | ApiOrderCustomer;
  addressId?: string | ApiOrderAddress;
  items?: ApiOrderItem[];
  subtotal?: number;
  deliveryCharge?: number;
  discount?: number;
  grandTotal?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentExpiresAt?: string | null;
  orderStatus?: string;
  statusHistory?: { status?: string; timestamp?: string; updatedAt?: string; note?: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export const getAdminOrders = (
  params: { search?: string; status?: string; page?: number; limit?: number } = {},
  token: string | null,
) => request<any>(`/api/order/admin/all${qs(params)}`, { method: "GET" }, { token });

export const updateOrderStatus = (id: string, orderStatus: ApiOrderStatus, token: string | null) =>
  request<ApiOrder>(`/api/order/${id}/status`, { method: "PATCH", ...jsonBody({ orderStatus }) }, { token });

export const orderCustomer = (o: ApiOrder): ApiOrderCustomer | null =>
  o.userId && typeof o.userId === "object" ? o.userId : null;

export const orderAddress = (o: ApiOrder): ApiOrderAddress | null =>
  o.addressId && typeof o.addressId === "object" ? o.addressId : null;

export const addressLine = (a: ApiOrderAddress | null) =>
  a
    ? [a.addressLine1 ?? a.address, a.addressLine2, a.landmark, a.area, a.city, a.pincode].filter(Boolean).join(", ")
    : "—";

export const orderCity = (o: ApiOrder) => orderAddress(o)?.city ?? "";

export const itemName = (it: ApiOrderItem) =>
  it.name ?? it.productName ?? (typeof it.productId === "object" ? (it.productId?.name ?? "Item") : "Item");

export const itemQty = (it: ApiOrderItem) => it.quantity ?? it.qty ?? 1;
export const itemPrice = (it: ApiOrderItem) => it.price ?? it.unitPrice ?? 0;

export const statusLabel = (s?: string) => (s ?? "").toLowerCase().replace(/_/g, " ") || "unknown";

const productRef = (v: unknown): ApiProductRef | null => (v && typeof v === "object" ? (v as ApiProductRef) : null);

const substitutionObject = (it: ApiOrderItem): ApiSubstitutionPreference | null =>
  it.substitutionPreference && typeof it.substitutionPreference === "object"
    ? (it.substitutionPreference as ApiSubstitutionPreference)
    : null;

/** Replacement product chosen by the customer, supporting the current backend snapshot shape. */
export const itemReplacement = (it: ApiOrderItem): ApiProductRef | null => {
  const sub = substitutionObject(it);

  // The backend stores a snapshot on the order item. The replacement id is
  // normally a string/ObjectId, while the human-readable name/image are stored
  // beside it. Build a UI product ref from that snapshot so the admin panel
  // does not fall back to showing only the raw ObjectId.
  const nestedReplacement = productRef(sub?.preferredReplacementProductId);
  if (nestedReplacement) return nestedReplacement;

  if (sub?.preferredReplacementProductId || sub?.preferredReplacementProductName || sub?.preferredReplacementImage) {
    const id = typeof sub.preferredReplacementProductId === "string" ? sub.preferredReplacementProductId : undefined;

    return {
      _id: id,
      name: sub.preferredReplacementProductName ?? undefined,
      image: sub.preferredReplacementImage ?? undefined,
    };
  }

  return productRef(it.replacementProduct) ?? productRef(it.preferredReplacementProductId);
};

export const itemReplacementId = (it: ApiOrderItem): string | null => {
  const ref = itemReplacement(it);
  if (ref?._id) return ref._id;

  const sub = substitutionObject(it);
  const nested = sub?.preferredReplacementProductId;
  if (typeof nested === "string") return nested;

  return typeof it.preferredReplacementProductId === "string" ? it.preferredReplacementProductId : null;
};

export const productImage = (p: ApiProductRef | null) => p?.images?.[0] ?? p?.image ?? null;

export const itemSubstitution = (it: ApiOrderItem): SubstitutionPreference | null => {
  const sub = substitutionObject(it);
  const raw = String(sub?.type ?? it.substitutionPreference ?? "").toUpperCase();

  if (raw === "BEST_SIMILAR_ITEM") return "BEST_SIMILAR";
  if (raw === "SPECIFIC_ITEM") return "SPECIFIC_PRODUCT";

  return (SUBSTITUTION_PREFERENCES as readonly string[]).includes(raw) ? (raw as SubstitutionPreference) : null;
};

export const substitutionLabel = (p: SubstitutionPreference) =>
  p === "CALL_ME"
    ? "Call me"
    : p === "BEST_SIMILAR"
      ? "Best similar item"
      : p === "DO_NOT_SUBSTITUTE"
        ? "Do not substitute"
        : "Specific replacement";

export const substitutionTone = (p: SubstitutionPreference) =>
  p === "CALL_ME" ? "warning" : p === "BEST_SIMILAR" ? "success" : p === "DO_NOT_SUBSTITUTE" ? "danger" : "info";

export const apiOrderStatusTone = (s?: string) => {
  const g = orderGroup(s);
  return g === "pending" ? "warning" : g === "live" ? "info" : g === "completed" ? "success" : "danger";
};

export const apiPayStatusTone = (s?: string) => {
  const v = (s ?? "").toUpperCase();
  if (v === "PAID" || v === "SUCCESS" || v === "COMPLETED") return "success";
  if (v === "PENDING") return "warning";
  return "danger";
};

export const nextStatuses = (current?: string, paymentMethod?: string, paymentStatus?: string): ApiOrderStatus[] => {
  if (String(paymentMethod ?? "").toUpperCase() === "ONLINE" && String(paymentStatus ?? "").toUpperCase() !== "PAID")
    return [];

  switch ((current ?? "").toUpperCase()) {
    case "PENDING":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["PACKING", "CANCELLED"];
    case "PACKING":
      return ["READY_FOR_PICKUP", "CANCELLED"];
    case "READY_FOR_PICKUP":
      return ["OUT_FOR_DELIVERY", "CANCELLED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED", "CANCELLED"];
    default:
      return [];
  }
};
