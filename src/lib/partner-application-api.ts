import { request } from "./catalog";

export type PartnerApplication = {
  _id: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  vehicleMakeModel?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  userId?: { _id?: string; name?: string; email?: string; phone?: string; isEmailVerified?: boolean; isActive?: boolean };
};

export async function getPartnerApplications(token: string | null, status = "PENDING") {
  return (await request<PartnerApplication[]>(`/api/partner-applications?status=${status}&limit=100`, { method: "GET" }, { token })).data;
}

export async function approvePartnerApplication(token: string | null, id: string) {
  return (await request<PartnerApplication>(`/api/partner-applications/${id}/approve`, { method: "PATCH" }, { token })).data;
}

export async function rejectPartnerApplication(token: string | null, id: string, reason: string) {
  return (await request<PartnerApplication>(`/api/partner-applications/${id}/reject`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) }, { token })).data;
}
