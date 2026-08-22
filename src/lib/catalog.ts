import { API_BASE_URL } from "./auth";

// ---------------------------------------------------------------------------
// Shared request layer (mirrors src/lib/profile.ts conventions)
// ---------------------------------------------------------------------------

export type ApiResponse<T> = { success: boolean; message?: string; data: T };

type Options = { token?: string | null; auth?: boolean };

export async function request<T>(
  path: string,
  init: RequestInit,
  { token, auth = true }: Options = {},
): Promise<ApiResponse<T>> {
  if (auth && !token) throw new Error("Your session has expired. Please sign in again.");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON (e.g. HTML 404 page) */
  }

  if (!res.ok || json?.success === false) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event("f15-auth-expired"),
        );
      }

      throw new Error(
        json?.message ||
        "Your session has expired. Please sign in again.",
      );
    }
    if (res.status === 403) throw new Error(json?.message || "You do not have permission to perform this action.");
    if (res.status === 404 && !json) throw new Error("This endpoint is not available on the server yet.");
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return (json ?? { success: true, data: null }) as ApiResponse<T>;
}

export const jsonBody = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// list payloads may be data:[...] or data:{ items|docs|categories|products: [...] }
export function toList<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  for (const k of ["items", "docs", "results", "categories", "products", "inventory", "inventories", "list", "data"]) {
    if (Array.isArray(data[k])) return data[k] as T[];
  }
  return [];
}

export const qs = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type ApiCategory = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: string;
  isActive?: boolean;
  productCount?: number;
  sortOrder?: number;
};

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  status?: string;
  image?: File | null;
};

function categoryForm(input: CategoryInput): FormData {
  const fd = new FormData();
  fd.append("name", input.name);
  if (input.slug) fd.append("slug", input.slug);
  if (input.description !== undefined) fd.append("description", input.description);
  if (input.status) fd.append("status", input.status);
  // Only append the file when a new one was picked — the backend keeps the
  // existing image when the field is absent.
  if (input.image) fd.append("image", input.image);
  return fd;
}

export const getCategories = (
  params: { search?: string; status?: string; page?: number; limit?: number } = {},
  token?: string | null,
) => request<any>(`/api/category${qs(params)}`, { method: "GET" }, { token, auth: false });

export const getCategoryById = (id: string, token?: string | null) =>
  request<ApiCategory>(`/api/category/${id}`, { method: "GET" }, { token, auth: false });

export const createCategory = (input: CategoryInput, token: string | null) =>
  request<ApiCategory>("/api/category", { method: "POST", body: categoryForm(input) }, { token });

export const updateCategory = (id: string, input: CategoryInput, token: string | null) =>
  request<ApiCategory>(`/api/category/${id}`, { method: "PUT", body: categoryForm(input) }, { token });

export const updateCategoryStatus = (id: string, status: string, token: string | null) =>
  request<ApiCategory>(`/api/category/${id}/status`, { method: "PATCH", ...jsonBody({ status }) }, { token });

export const deleteCategory = (id: string, token: string | null) =>
  request<null>(`/api/category/${id}`, { method: "DELETE" }, { token });

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export type ProductUnit = "KG" | "GRAM" | "LITER" | "ML" | "PIECE" | "PACK" | "DOZEN" | "BUNDLE";

export type ApiProduct = {
  _id: string;
  status?: string;
  category?: { _id?: string; name?: string; slug?: string; image?: string };

  categoryId?:
  | string
  | {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
  };
  name: string;
  slug?: string;
  description?: string;
  images?: string[];
  unit?: ProductUnit;
  weight?: number;
  sku?: string;
  mrp?: number;
  sellingPrice?: number;
  stock?: number;
  tags?: string[];
  averageRating?: number;
  totalReviews?: number;
  isVeg?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductInput = {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  sellingPrice: number;
  mrp: number;
  unit: ProductUnit;
  weight: number;
  stock?: number;
  isVeg?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  images?: File[];
};

export const MAX_PRODUCT_IMAGES = 5;

function productForm(input: ProductInput): FormData {
  const fd = new FormData();

  fd.append("name", input.name);
  fd.append("sku", input.sku);
  fd.append("categoryId", input.categoryId);
  fd.append("sellingPrice", String(input.sellingPrice));
  fd.append("mrp", String(input.mrp));
  fd.append("unit", input.unit);
  fd.append("weight", String(input.weight));

  if (input.description !== undefined) {
    fd.append("description", input.description);
  }

  if (input.stock !== undefined) {
    fd.append("stock", String(input.stock));
  }

  if (input.isVeg !== undefined) {
    fd.append("isVeg", String(input.isVeg));
  }

  if (input.isFeatured !== undefined) {
    fd.append("isFeatured", String(input.isFeatured));
  }

  if (input.tags?.length) {
    input.tags.forEach((tag) => {
      fd.append("tags[]", tag);
    });
  }

  (input.images ?? []).slice(0, MAX_PRODUCT_IMAGES).forEach((file) => {
    fd.append("images", file);
  });

  return fd;
}

export const getProducts = (
  params: { search?: string; category?: string; status?: string; page?: number; limit?: number } = {},
  token?: string | null,
) => request<any>(`/api/product${qs(params)}`, { method: "GET" }, { token, auth: false });

export const getProductById = (id: string, token?: string | null) =>
  request<ApiProduct>(`/api/product/${id}`, { method: "GET" }, { token, auth: false });

export const createProduct = (input: ProductInput, token: string | null) =>
  request<ApiProduct>("/api/product", { method: "POST", body: productForm(input) }, { token });

export const updateProduct = (id: string, input: ProductInput, token: string | null) =>
  request<ApiProduct>(`/api/product/${id}`, { method: "PUT", body: productForm(input) }, { token });

export const updateProductStatus = (id: string, status: string, token: string | null) =>
  request<ApiProduct>(`/api/product/${id}/status`, { method: "PATCH", ...jsonBody({ status }) }, { token });

export const deleteProduct = (id: string, token: string | null) =>
  request<null>(`/api/product/${id}`, { method: "DELETE" }, { token });

// ---------------------------------------------------------------------------
// Inventory (authoritative stock source)
// ---------------------------------------------------------------------------

export type ApiInventory = {
  _id: string;
  productId?:
  | string
  | {
    _id: string;
    name?: string;
    sku?: string;
    images?: string[];
    unit?: string;
  };
  currentStock?: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold?: number;
  status?: string;
  updatedAt?: string;
};

export const getInventory = (
  params: { search?: string; status?: string; page?: number; limit?: number } = {},
  token: string | null,
) => request<any>(`/api/inventory${qs(params)}`, { method: "GET" }, { token });

export type InventoryUpdateInput = {
  currentStock?: number;
  lowStockThreshold?: number;
};

export const getInventoryByProduct = (productId: string, token: string | null) =>
  request<ApiInventory>(`/api/inventory/${productId}`, { method: "GET" }, { token });

export const updateInventory = (id: string, input: InventoryUpdateInput, token: string | null) =>
  request<ApiInventory>(`/api/inventory/${id}`, { method: "PUT", ...jsonBody(input) }, { token });

export const updateInventoryStock = (id: string, currentStock: number, token: string | null) =>
  request<ApiInventory>(`/api/inventory/${id}/stock`, { method: "PATCH", ...jsonBody({ currentStock }) }, { token });

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export const categoryId = (p: ApiProduct): string =>
  typeof p.categoryId === "string" ? p.categoryId : (p.categoryId?._id ?? "");

export const isActiveStatus = (v: { status?: string; isActive?: boolean }) =>
  v.isActive !== undefined ? !!v.isActive : (v.status ?? "").toLowerCase() === "active";

export const statusValue = (active: boolean) => (active ? "active" : "inactive");
