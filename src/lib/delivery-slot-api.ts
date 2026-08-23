import { request, jsonBody, toList } from "./catalog";

export type AdminDeliverySlot = {
  _id: string;
  label: string;
  type: "ASAP" | "FIXED";
  fromMinutes: number;
  toMinutes: number;
  leadTimeMinutes: number;
  cutoffMinutesBeforeStart: number;
  capacity: number;
  active: boolean;
  sortOrder: number;
};
export type AdminDeliveryZone = {
  _id: string;
  name: string;
  pincodes: string[];
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number;
  fee: number;
  minOrder: number;
  maxConcurrentOrders: number;
  travelMinutes: number;
  workloadDelayMinutes: number;
  active: boolean;
};
export type AdminDeliveryStore = {
  _id: string;
  name: string;
  code: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm: number;
  maxConcurrentOrders: number;
  prepMinutes: number;
  active: boolean;
};

export const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const timeToMinutes = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return Math.max(0, Math.min(1440, (h || 0) * 60 + (m || 0)));
};

export const deliveryConfigApi = {
  async slots(token: string | null) {
    const r = await request<AdminDeliverySlot[]>("/api/delivery-slots/admin/slots", { method: "GET" }, { token });
    return toList<AdminDeliverySlot>(r.data);
  },
  async createSlot(token: string | null, body: Partial<AdminDeliverySlot>) {
    const r = await request<AdminDeliverySlot>(
      "/api/delivery-slots/admin/slots",
      { method: "POST", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async updateSlot(token: string | null, id: string, body: Partial<AdminDeliverySlot>) {
    const r = await request<AdminDeliverySlot>(
      `/api/delivery-slots/admin/slots/${id}`,
      { method: "PATCH", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async deleteSlot(token: string | null, id: string) {
    await request<null>(`/api/delivery-slots/admin/slots/${id}`, { method: "DELETE" }, { token });
  },
  async zones(token: string | null) {
    const r = await request<AdminDeliveryZone[]>("/api/delivery-slots/admin/zones", { method: "GET" }, { token });
    return toList<AdminDeliveryZone>(r.data);
  },
  async createZone(token: string | null, body: Partial<AdminDeliveryZone>) {
    const r = await request<AdminDeliveryZone>(
      "/api/delivery-slots/admin/zones",
      { method: "POST", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async updateZone(token: string | null, id: string, body: Partial<AdminDeliveryZone>) {
    const r = await request<AdminDeliveryZone>(
      `/api/delivery-slots/admin/zones/${id}`,
      { method: "PATCH", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async deleteZone(token: string | null, id: string) {
    await request<null>(`/api/delivery-slots/admin/zones/${id}`, { method: "DELETE" }, { token });
  },
  async stores(token: string | null) {
    const r = await request<AdminDeliveryStore[]>("/api/delivery-slots/admin/stores", { method: "GET" }, { token });
    return toList<AdminDeliveryStore>(r.data);
  },
  async createStore(token: string | null, body: Partial<AdminDeliveryStore>) {
    const r = await request<AdminDeliveryStore>(
      "/api/delivery-slots/admin/stores",
      { method: "POST", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async updateStore(token: string | null, id: string, body: Partial<AdminDeliveryStore>) {
    const r = await request<AdminDeliveryStore>(
      `/api/delivery-slots/admin/stores/${id}`,
      { method: "PATCH", ...jsonBody(body) },
      { token },
    );
    return r.data;
  },
  async deleteStore(token: string | null, id: string) {
    await request<null>(`/api/delivery-slots/admin/stores/${id}`, { method: "DELETE" }, { token });
  },
};
