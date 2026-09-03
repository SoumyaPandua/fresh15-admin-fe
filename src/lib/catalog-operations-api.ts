
import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { API_BASE_URL } from "./auth";
import { useAuth } from "./auth";

export type CatalogImportPreview = {
  fileName: string;
  rowCount: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  canCommit: boolean;
  rows: Array<{
    rowNumber: number;
    sku: string;
    name: string;
    category: string;
    sellingPrice: number | null;
    mrp: number | null;
    stock: number | null;
    imageCount: number;
    issues: string[];
    warnings: string[];
  }>;
};

export type CatalogImportJob = {
  _id: string;
  status: string;
  fileName: string;
  rowCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  createdBy?: { name?: string; email?: string } | null;
};

export type CatalogQuality = {
  summary: {
    total: number;
    averageScore: number;
    good: number;
    needsWork: number;
    poor: number;
    missingImages: number;
    badPricing: number;
    lowStock: number;
    outOfStock: number;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    image?: string | null;
    sellingPrice: number;
    stock: number;
    isActive: boolean;
    score: number;
    grade: "GOOD" | "NEEDS_WORK" | "POOR";
    issues: string[];
  }>;
};

export type CatalogOperationsOverview = {
  products: number;
  activeProducts: number;
  categories: number;
  imports: number;
  failedImports: number;
  queuedImports: number;
  quality: CatalogQuality["summary"];
  inventory: { totalUnits: number; availableUnits: number; reservedUnits: number };
};

export async function previewCatalogImport(token: string | null, csv: string) {
  return (await request<CatalogImportPreview>("/api/catalog-operations/imports/preview", {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: csv,
  }, { token })).data;
}

export async function createCatalogImport(token: string | null, csv: string, fileName: string) {
  return (await request<CatalogImportJob>("/api/catalog-operations/imports", {
    method: "POST",
    headers: { "Content-Type": "text/csv", "X-File-Name": fileName },
    body: csv,
  }, { token })).data;
}

export async function getCatalogImports(token: string | null) {
  return (await request<{ items: CatalogImportJob[] }>("/api/catalog-operations/imports?limit=20", { method: "GET" }, { token })).data.items;
}

export async function getCatalogQuality(token: string | null) {
  return (await request<CatalogQuality>("/api/catalog-operations/quality?limit=100", { method: "GET" }, { token })).data;
}

export async function getCatalogOperationsOverview(token: string | null) {
  return (await request<CatalogOperationsOverview>("/api/catalog-operations/overview", { method: "GET" }, { token })).data;
}

export async function retryCatalogImport(token: string | null, importId: string) {
  return (await request<CatalogImportJob>(`/api/catalog-operations/imports/${importId}/retry-failed`, { method: "POST" }, { token })).data;
}

export const catalogTemplateUrl = `${API_BASE_URL}/api/catalog-operations/template.csv`;

export function importReportUrl(importId: string) {
  return `${API_BASE_URL}/api/catalog-operations/imports/${importId}/report.csv`;
}

export function useCatalogQuality() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["catalog-quality"],
    enabled: Boolean(token),
    queryFn: () => getCatalogQuality(token),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCatalogOperationsOverview() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["catalog-operations-overview"],
    enabled: Boolean(token),
    queryFn: () => getCatalogOperationsOverview(token),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
