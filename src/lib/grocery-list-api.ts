import { useQuery } from "@tanstack/react-query";
import { request, qs, toList } from "./catalog";
import { useAuth } from "./auth";

export type AdminGroceryList = {
  _id: string;
  name: string;
  listType: "WEEKLY_ESSENTIALS" | "CUSTOM";
  repeatInterval: "NONE" | "WEEKLY";
  isPinned: boolean;

  items?: Array<{
    productId?:
      | {
          _id?: string;
          name?: string;
          images?: string[];
          sellingPrice?: number;
          unit?: string;
        }
      | string;

    quantity?: number;
  }>;

  userId?:
    | {
        _id?: string;
        name?: string;
        email?: string;
        phone?: string;
      }
    | string;

  updatedAt?: string;
};

export type GroceryListSummary = {
  totalLists: number;
  pinnedLists: number;
  weeklyLists: number;
  totalItems: number;

  topProducts: Array<{
    productId: string;
    name?: string;
    image?: string;
    sellingPrice?: number;
    lists: number;
    quantity: number;
  }>;
};

export async function getAdminGroceryListSummary(
  token: string | null,
) {
  return request<GroceryListSummary>(
    "/api/grocery-lists/admin/summary",
    {
      method: "GET",
    },
    {
      token,
    },
  );
}

export async function getAdminGroceryLists(
  token: string | null,
  limit = 100,
) {
  return request<AdminGroceryList[]>(
    `/api/grocery-lists/admin${qs({ limit })}`,
    {
      method: "GET",
    },
    {
      token,
    },
  );
}

export function useAdminGroceryListSummary() {
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "admin-grocery-lists",
      "summary",
    ],

    enabled: Boolean(token),

    queryFn: async () => {
      const response =
        await getAdminGroceryListSummary(
          token,
        );

      return response.data;
    },

    staleTime: 30_000,
  });
}

export function useAdminGroceryLists() {
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "admin-grocery-lists",
    ],

    enabled: Boolean(token),

    queryFn: async () => {
      const response =
        await getAdminGroceryLists(
          token,
          200,
        );

      return toList<AdminGroceryList>(
        response.data,
      );
    },

    staleTime: 30_000,
  });
}