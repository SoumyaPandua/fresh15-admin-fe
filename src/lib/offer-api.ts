import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, toList } from "./catalog";
import { useAuth } from "./auth";

// ---------------------------------------------------------------------------
// Types — mirror the backend Offer model
// ---------------------------------------------------------------------------

export type ApiOffer = {
  _id: string;
  title?: string;
  description?: string;
  discount?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OfferInput = {
  title: string;
  description?: string;
  discount?: string;
  category?: string;
  isActive?: boolean;
};

// ---------------------------------------------------------------------------
// Raw API calls
// ---------------------------------------------------------------------------

export const fetchOffers = async (token?: string | null) =>
  toList<ApiOffer>((await request<any>("/api/offer", { method: "GET" }, { token })).data);

export const fetchActiveOffers = async (token?: string | null) =>
  toList<ApiOffer>((await request<any>("/api/offer/active", { method: "GET" }, { token })).data);

export const fetchOffer = (id: string, token?: string | null) =>
  request<ApiOffer>(`/api/offer/${id}`, { method: "GET" }, { token });

export const createOffer = (input: OfferInput, token?: string | null) =>
  request<ApiOffer>("/api/offer", { method: "POST", ...jsonBody(input) }, { token });

export const updateOffer = (id: string, input: Partial<OfferInput>, token?: string | null) =>
  request<ApiOffer>(`/api/offer/${id}`, { method: "PATCH", ...jsonBody(input) }, { token });

export const updateOfferStatus = (id: string, isActive: boolean, token?: string | null) =>
  request<ApiOffer>(`/api/offer/${id}/status`, { method: "PATCH", ...jsonBody({ isActive }) }, { token });

export const deleteOffer = (id: string, token?: string | null) =>
  request<any>(`/api/offer/${id}`, { method: "DELETE" }, { token });

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const offerKeys = {
  all: ["offers"] as const,
  list: () => ["offers", "list"] as const,
};

export function useOffers() {
  const { token } = useAuth();
  return useQuery({ queryKey: offerKeys.list(), enabled: !!token, queryFn: () => fetchOffers(token) });
}

export function useOfferMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: offerKeys.all });

  const create = useMutation({ mutationFn: (input: OfferInput) => createOffer(input, token), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (v: { id: string; input: Partial<OfferInput> }) => updateOffer(v.id, v.input, token),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => updateOfferStatus(v.id, v.isActive, token),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteOffer(id, token), onSuccess: invalidate });

  return { create, update, setStatus, remove };
}
