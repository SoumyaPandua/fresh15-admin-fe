import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, jsonBody } from "./catalog";
import { useAuth } from "./auth";

export type ApiCustomer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  orders?: number;
  spent?: number;
  joined?: string;
  status?: "active" | "inactive" | string;
  tier?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  profileImage?: string | null;
};

export type CustomerSummary = {
  totalCustomers?: number;
  activeCustomers?: number;
  inactiveCustomers?: number;
  lifetimeValue?: number;
  totalRevenue?: number;
  totalSpent?: number;
  [key: string]: unknown;
};

export type CustomerInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;

export type Tier = (typeof TIERS)[number];

export const customerOrders = (customer: ApiCustomer) => Number(customer.orders ?? 0);

export const customerSpent = (customer: ApiCustomer) => Number(customer.spent ?? 0);

export const customerCity = (customer: ApiCustomer) => customer.city ?? "";

export const customerAvatar = (customer: ApiCustomer) =>
  customer.profileImage || `https://i.pravatar.cc/80?u=${encodeURIComponent(customer.email || customer.id)}`;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const fetchCustomers = async (token?: string | null) => {
  const response = await request<any>("/api/customer", { method: "GET" }, { token });

  return (response.data?.customers ?? []) as ApiCustomer[];
};

export const fetchCustomerSummary = async (token?: string | null) => {
  const response = await request<any>("/api/customer/summary", { method: "GET" }, { token });

  return (response.data ?? {}) as CustomerSummary;
};

export const createCustomer = (input: CustomerInput, token?: string | null) =>
  request<any>(
    "/api/customer",
    {
      method: "POST",
      ...jsonBody({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
        role: "CUSTOMER",
        portal: "customer",
      }),
    },
    { token },
  );

export const updateCustomerStatus = (id: string, isActive: boolean, token?: string | null) =>
  request<any>(
    `/api/customer/${id}/status`,
    {
      method: "PATCH",
      ...jsonBody({ isActive }),
    },
    { token },
  );

export const updateCustomerTier = (id: string, tier: string, token?: string | null) =>
  request<any>(
    `/api/customer/${id}/tier`,
    {
      method: "PATCH",
      ...jsonBody({ tier }),
    },
    { token },
  );

export const deleteCustomer = (id: string, token?: string | null) =>
  request<any>(
    `/api/customer/${id}`,
    {
      method: "DELETE",
    },
    { token },
  );

// ---------------------------------------------------------------------------
// React Query
// ---------------------------------------------------------------------------

export const customerKeys = {
  all: ["customers"] as const,
  list: () => ["customers", "list"] as const,
  summary: () => ["customers", "summary"] as const,
};

export function useCustomers() {
  const { token } = useAuth();

  return useQuery({
    queryKey: customerKeys.list(),
    enabled: !!token,
    queryFn: () => fetchCustomers(token),
  });
}

export function useCustomerSummary() {
  const { token } = useAuth();

  return useQuery({
    queryKey: customerKeys.summary(),
    enabled: !!token,
    queryFn: () => fetchCustomerSummary(token),
  });
}

export function useCustomerMutations() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: customerKeys.all,
    });
  };

  const create = useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input, token),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: (value: { id: string; isActive: boolean }) => updateCustomerStatus(value.id, value.isActive, token),
    onSuccess: invalidate,
  });

  const setTier = useMutation({
    mutationFn: (value: { id: string; tier: string }) => updateCustomerTier(value.id, value.tier, token),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCustomer(id, token),
    onSuccess: invalidate,
  });

  return {
    create,
    setStatus,
    setTier,
    remove,
  };
}
