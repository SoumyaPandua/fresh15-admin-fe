import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./catalog";
import { useAuth } from "./auth";

export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportMessage = {
  _id: string;
  message: string;
  senderRole: string;
  createdAt: string;
  senderId?: { _id?: string; name?: string; email?: string; role?: string };
};

export type SupportTicket = {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: SupportPriority;
  status: SupportStatus;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
  userId?: { _id?: string; name?: string; email?: string; phone?: string } | string;
  messages?: SupportMessage[];
};

const list = (token: string) => request<SupportTicket[]>("/api/support", { method: "GET" }, { token });
const get = (token: string, id: string) => request<SupportTicket>(`/api/support/${id}`, { method: "GET" }, { token });
const setStatus = (token: string, id: string, status: SupportStatus) =>
  request<SupportTicket>(`/api/support/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }, { token });
const addMessage = (token: string, id: string, message: string) =>
  request<SupportMessage>(`/api/support/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }, { token });

export function useSupportTickets() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ["support-tickets", token],
    queryFn: () => list(token as string).then((res) => res.data),
    enabled: Boolean(token),
    staleTime: 15_000,
  });
}

export function useSupportTicket(id: string | null) {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ["support-ticket", token, id],
    queryFn: () => get(token as string, id as string).then((res) => res.data),
    enabled: Boolean(token && id),
    staleTime: 5_000,
  });
}

export function useSupportMutations() {
  const token = useAuth((s) => s.token);
  const qc = useQueryClient();

  const invalidate = (id?: string) => {
    void qc.invalidateQueries({ queryKey: ["support-tickets", token] });
    if (id) void qc.invalidateQueries({ queryKey: ["support-ticket", token, id] });
  };

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: SupportStatus }) => setStatus(token as string, id, value),
    onSuccess: (_data, vars) => invalidate(vars.id),
  });

  const message = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => addMessage(token as string, id, value),
    onSuccess: (_data, vars) => invalidate(vars.id),
  });

  return { status, message };
}
