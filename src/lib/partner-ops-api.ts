
import { request, jsonBody } from "./catalog";

export type AdminPartnerOpsOverview = {
  openIncidents: number;
  expiringDocuments: number;
  totalCashCollected: number;
  activeShifts: number;
  activeIncentives: number;
};

export type AdminIncident = {
  _id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  partnerId?: { _id?: string; name?: string; phone?: string; email?: string } | null;
  orderId?: { _id?: string; orderNumber?: string } | null;
  deliveryId?: { _id?: string; status?: string } | null;
  resolutionNote?: string;
};

export type AdminShift = {
  _id: string;
  dateKey: string;
  startAt: string;
  endAt: string;
  status: string;
  partnerId?: { _id?: string; name?: string; phone?: string } | null;
};

export type AdminCashEntry = {
  _id: string;
  type: string;
  amount: number;
  createdAt: string;
  partnerId?: { _id?: string; name?: string; phone?: string } | null;
  orderId?: { _id?: string; orderNumber?: string } | null;
  note?: string;
};

export async function getAdminPartnerOpsOverview(token: string | null) {
  return (await request<AdminPartnerOpsOverview>("/api/partner-ops/admin/overview", { method: "GET" }, { token })).data;
}

export async function getAdminPartnerIncidents(token: string | null) {
  return (await request<AdminIncident[]>("/api/partner-ops/admin/incidents?limit=100", { method: "GET" }, { token })).data;
}

export async function resolveAdminPartnerIncident(
  token: string | null,
  id: string,
  status: "IN_REVIEW" | "RESOLVED",
  resolutionNote = "",
) {
  return (
    await request<AdminIncident>(
      `/api/partner-ops/admin/incidents/${id}`,
      { method: "PATCH", ...jsonBody({ status, resolutionNote }) },
      { token },
    )
  ).data;
}

export async function getAdminPartnerShifts(token: string | null) {
  return (await request<AdminShift[]>("/api/partner-ops/admin/shifts?limit=100", { method: "GET" }, { token })).data;
}

export async function getAdminPartnerCash(token: string | null) {
  return (await request<AdminCashEntry[]>("/api/partner-ops/admin/cash?limit=100", { method: "GET" }, { token })).data;
}


export async function createAdminPartnerIncentive(
  token: string | null,
  input: {
    title: string;
    description?: string;
    amount: number;
    targetDeliveries: number;
    startAt: string;
    endAt: string;
    partnerId?: string | null;
  },
) {
  return (
    await request<any>(
      "/api/partner-ops/admin/incentives",
      { method: "POST", ...jsonBody(input) },
      { token },
    )
  ).data;
}
