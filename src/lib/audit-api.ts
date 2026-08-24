import { useQuery } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type ApiAuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip: string;
  resourceType?: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
};

type AuditResponse = {
  items: ApiAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export function useAdminAuditLogs() {
  const { token, user } = useAuth();
  const role = (user?.role ?? "").toUpperCase();

  return useQuery({
    queryKey: ["admin-audit-logs"],
    enabled: !!token && ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "PLATFORM_ADMIN"].includes(role),
    queryFn: async () => {
      const response = await request<AuditResponse>(
        "/api/audit/admin?limit=200",
        { method: "GET" },
        { token },
      );
      return response.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
