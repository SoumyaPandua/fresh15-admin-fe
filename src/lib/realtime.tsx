import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { connectSocket, disconnectSocket, REALTIME_EVENTS, type RealtimeEvent } from "./socket";

export type PartnerPresence = { online: boolean; status?: string; at: number };
export type PartnerLocation = {
  lat: number;
  lng: number;
  at: number;
  deliveryId?: string;
  orderId?: string;
  destination?: { latitude: number; longitude: number } | null;
};

type Handler = (payload: any) => void;

type RealtimeContextValue = {
  connected: boolean;
  presence: Record<string, PartnerPresence>;
  locations: Record<string, PartnerLocation>;
  subscribe: (event: RealtimeEvent, handler: Handler) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  presence: {},
  locations: {},
  subscribe: () => () => {},
});

const idOf = (p: any): string => String(p?.partnerId ?? p?.riderId ?? p?.userId ?? p?.id ?? p?._id ?? "");

const isOnline = (p: any): boolean => {
  const raw = p?.isOnline ?? p?.online ?? p?.status ?? p?.availability;
  if (typeof raw === "boolean") return raw;
  const s = String(raw ?? "").toUpperCase();
  return ["ONLINE", "AVAILABLE", "ACTIVE", "TRUE"].includes(s);
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<Record<string, PartnerPresence>>({});
  const [locations, setLocations] = useState<Record<string, PartnerLocation>>({});
  const handlers = useRef(new Map<RealtimeEvent, Set<Handler>>());

  const subscribe = useCallback((event: RealtimeEvent, handler: Handler) => {
    const set = handlers.current.get(event) ?? new Set<Handler>();
    set.add(handler);
    handlers.current.set(event, set);
    return () => {
      set.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket(token);
    if (!socket) return;

    const emit = (event: RealtimeEvent, payload: any) => handlers.current.get(event)?.forEach((h) => h(payload));

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) {
      setConnected(true);
      socket.emit("join:admin");
    }

    const invalidateOrders = () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
    };
    const invalidateDeliveries = () => {
      void qc.invalidateQueries({ queryKey: ["deliveries"] });
      void qc.invalidateQueries({ queryKey: ["delivery"] });
    };

    const listeners: Array<[RealtimeEvent, Handler]> = [
      [
        "order:new",
        (p) => {
          invalidateOrders();
          invalidateDeliveries();
          emit("order:new", p);
        },
      ],
      [
        "order:updated",
        (p) => {
          invalidateOrders();
          invalidateDeliveries();
          emit("order:updated", p);
        },
      ],
      [
        "partner:status",
        (p) => {
          const id = idOf(p);
          if (id) {
            setPresence((prev) => ({
              ...prev,
              [id]: { online: isOnline(p), status: p?.status, at: Date.now() },
            }));
          }
          emit("partner:status", p);
        },
      ],
      [
        "partner:location",
        (p) => {
          const id = idOf(p);
          const lat = Number(p?.lat ?? p?.latitude ?? p?.location?.lat ?? p?.coordinates?.[1]);
          const lng = Number(p?.lng ?? p?.longitude ?? p?.location?.lng ?? p?.coordinates?.[0]);
          if (id && Number.isFinite(lat) && Number.isFinite(lng)) {
            setLocations((prev) => ({
              ...prev,
              [id]: {
                lat,
                lng,
                at: Date.now(),
                deliveryId: p?.deliveryId ? String(p.deliveryId) : undefined,
                orderId: p?.orderId ? String(p.orderId) : undefined,
                destination:
                  p?.destination &&
                  Number.isFinite(Number(p.destination.latitude)) &&
                  Number.isFinite(Number(p.destination.longitude))
                    ? {
                        latitude: Number(p.destination.latitude),
                        longitude: Number(p.destination.longitude),
                      }
                    : null,
              },
            }));
          }
          emit("partner:location", p);
        },
      ],
      [
        "partner:assigned",
        (p) => {
          invalidateDeliveries();
          invalidateOrders();
          emit("partner:assigned", p);
        },
      ],
      [
        "delivery:updated",
        (p) => {
          invalidateDeliveries();
          invalidateOrders();
          emit("delivery:updated", p);
        },
      ],
      [
        "partner:availability",
        (p) => {
          emit("partner:availability", p);
        },
      ],
    ];

    listeners.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      listeners.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [token, user, qc]);

  // Drop the connection entirely when the admin logs out.
  useEffect(
    () => () => {
      disconnectSocket();
    },
    [],
  );

  const value = useMemo(
    () => ({ connected, presence, locations, subscribe }),
    [connected, presence, locations, subscribe],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);

/** Subscribe a component to one realtime event for the duration of its life. */
export function useRealtimeEvent(event: RealtimeEvent, handler: Handler) {
  const { subscribe } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe(event, (p) => ref.current(p)), [event, subscribe]);
}

/** Subscribe to several events with the same handler (e.g. refresh a list). */
export function useRealtimeEvents(events: RealtimeEvent[], handler: Handler) {
  const { subscribe } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  const key = events.join(",");
  useEffect(() => {
    const offs = key
      .split(",")
      .filter(Boolean)
      .map((e) => subscribe(e as RealtimeEvent, (p) => ref.current(p)));
    return () => offs.forEach((off) => off());
  }, [key, subscribe]);
}

export { REALTIME_EVENTS };
