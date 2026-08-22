import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./auth";

/**
 * Reusable socket service — a single shared connection to the Fresh15 backend.
 * REST APIs are untouched; sockets only deliver realtime updates.
 */

export type RealtimeEvent =
  | "order:new"
  | "order:updated"
  | "partner:status"
  | "partner:location"
  | "partner:assigned"
  | "delivery:updated"
  | "partner:availability";

export const REALTIME_EVENTS: RealtimeEvent[] = [
  "order:new",
  "order:updated",
  "partner:status",
  "partner:location",
  "partner:assigned",
  "delivery:updated",
  "partner:availability",
];

let socket: Socket | null = null;
let currentToken: string | null = null;

/** Connect (or reuse) the shared socket for the given admin JWT. */
export function connectSocket(token: string | null): Socket | null {
  if (typeof window === "undefined" || !token) return null;

  if (socket && currentToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  disconnectSocket();
  currentToken = token;

  socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
    query: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    withCredentials: false,
  });

  // Admin room — re-joined automatically on every (re)connect.
  socket.on("connect", () => socket?.emit("join:admin"));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentToken = null;
}
