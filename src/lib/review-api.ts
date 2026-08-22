import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, qs, toList } from "./catalog";
import { useAuth } from "./auth";

// ---------------------------------------------------------------------------
// Types — mirror the backend Review model
// ---------------------------------------------------------------------------

export type ReviewProductRef = {
  _id?: string;
  name?: string;
  images?: string[];
  averageRating?: number;
  totalReviews?: number;
};

export type ReviewUserRef = { _id?: string; name?: string; email?: string; profileImage?: string };

export type ApiReview = {
  _id: string;
  productId?: string | ReviewProductRef;
  orderId?: string | { _id?: string; orderNumber?: string };
  userId?: string | ReviewUserRef;
  rating?: number;
  title?: string;
  comment?: string;
  verifiedPurchase?: boolean;
  isVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Raw API calls
//
// The backend exposes the admin review list under /api/review/all (with
// /api/review/admin as an alias on some deployments). Both are tried so the
// page keeps working across backend revisions; no endpoints are invented.
// ---------------------------------------------------------------------------

const LIST_PATHS = ["/api/review/all", "/api/review/admin"];

export async function fetchReviews(params: { limit?: number } = {}, token?: string | null) {
  let lastError: unknown;
  for (const path of LIST_PATHS) {
    try {
      const res = await request<any>(`${path}${qs(params)}`, { method: "GET" }, { token });
      return toList<ApiReview>(res.data);
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : "";
      // Only fall through when the route itself is missing.
      if (!/not available on the server/i.test(msg)) throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unable to load reviews.");
}

const updateReview = (id: string, patch: Partial<Pick<ApiReview, "isVisible">>, token?: string | null) =>
  request<ApiReview>(`/api/review/${id}`, { method: "PUT", ...jsonBody(patch) }, { token });

const removeReview = (id: string, token?: string | null) =>
  request<any>(`/api/review/${id}`, { method: "DELETE" }, { token });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const reviewProduct = (r: ApiReview): ReviewProductRef =>
  typeof r.productId === "object" && r.productId ? r.productId : { _id: (r.productId as string) || undefined };

export const reviewUser = (r: ApiReview): ReviewUserRef =>
  typeof r.userId === "object" && r.userId ? r.userId : { _id: (r.userId as string) || undefined };

export const reviewOrderId = (r: ApiReview): string | undefined =>
  typeof r.orderId === "object" && r.orderId ? r.orderId._id : (r.orderId as string) || undefined;

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (p: Record<string, unknown>) => ["reviews", "list", p] as const,
};

export function useReviews(params: { limit?: number } = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: reviewKeys.list(params),
    enabled: !!token,
    queryFn: () => fetchReviews({ limit: 200, ...params }, token),
  });
}

export function useReviewMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: reviewKeys.all });

  const setVisibility = useMutation({
    mutationFn: (v: { id: string; isVisible: boolean }) => updateReview(v.id, { isVisible: v.isVisible }, token),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeReview(id, token),
    onSuccess: invalidate,
  });

  return { setVisibility, remove };
}
