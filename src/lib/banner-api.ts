import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody, toList } from "./catalog";
import { useAuth } from "./auth";

export type BannerTargetType = "NONE" | "SEARCH" | "CATEGORY" | "PRODUCT" | "OFFER";

export type ApiBanner = {
  _id: string;
  title?: string;
  subtitle?: string;
  placement?: string;
  image?: string;
  ctaText?: string;
  targetType?: BannerTargetType;
  targetValue?: string;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BannerInput = {
  title: string;
  subtitle?: string;
  placement?: string;
  ctaText?: string;
  targetType?: BannerTargetType;
  targetValue?: string;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  image?: File | null;
};

function bannerForm(input: Partial<BannerInput>): FormData {
  const fd = new FormData();
  if (input.title !== undefined) fd.append("title", input.title);
  if (input.subtitle !== undefined) fd.append("subtitle", input.subtitle);
  if (input.placement !== undefined) fd.append("placement", input.placement);
  if (input.ctaText !== undefined) fd.append("ctaText", input.ctaText);
  if (input.targetType !== undefined) fd.append("targetType", input.targetType);
  if (input.targetValue !== undefined) fd.append("targetValue", input.targetValue);
  if (input.priority !== undefined) fd.append("priority", String(input.priority));
  if (input.startsAt) fd.append("startsAt", input.startsAt);
  if (input.endsAt) fd.append("endsAt", input.endsAt);
  if (input.isActive !== undefined) fd.append("isActive", String(input.isActive));
  if (input.image) fd.append("image", input.image);
  return fd;
}

export const fetchBanners = async (token?: string | null) =>
  toList<ApiBanner>((await request<any>("/api/banner", { method: "GET" }, { token })).data);

export const createBanner = (input: BannerInput, token?: string | null) =>
  request<ApiBanner>("/api/banner", { method: "POST", body: bannerForm(input) }, { token });

export const updateBanner = (id: string, input: Partial<BannerInput>, token?: string | null) =>
  request<ApiBanner>(`/api/banner/${id}`, { method: "PUT", body: bannerForm(input) }, { token });

export const updateBannerStatus = (id: string, isActive: boolean, token?: string | null) =>
  request<ApiBanner>(`/api/banner/${id}/status`, { method: "PATCH", ...jsonBody({ isActive }) }, { token });

export const deleteBanner = (id: string, token?: string | null) =>
  request<any>(`/api/banner/${id}`, { method: "DELETE" }, { token });

export const bannerKeys = {
  all: ["banners"] as const,
  list: () => ["banners", "list"] as const,
};

export function useBanners() {
  const { token } = useAuth();
  return useQuery({ queryKey: bannerKeys.list(), enabled: !!token, queryFn: () => fetchBanners(token) });
}

export function useBannerMutations() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: bannerKeys.all });

  const create = useMutation({ mutationFn: (input: BannerInput) => createBanner(input, token), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (v: { id: string; input: Partial<BannerInput> }) => updateBanner(v.id, v.input, token),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => updateBannerStatus(v.id, v.isActive, token),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteBanner(id, token), onSuccess: invalidate });

  return { create, update, setStatus, remove };
}
