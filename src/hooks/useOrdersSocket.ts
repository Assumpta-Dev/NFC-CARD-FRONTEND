import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Order } from "../types";

/**
 * Same origin the REST client uses.
 * Defaults match api.ts (port 5001) — not the Vite page origin,
 * because /socket.io was proxying to the wrong backend port.
 */
function socketBaseUrl() {
  const api = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:5001/api";
  return api.replace(/\/api\/?$/, "");
}

export type OrdersSocketStatus = "idle" | "connecting" | "connected" | "error";

/**
 * Live order inbox for business owners and staff.
 */
export function useOrdersSocket(options: {
  enabled: boolean;
  token: string | null;
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order | { id: string; deleted?: boolean }) => void;
}) {
  const { enabled, token, onOrderCreated, onOrderUpdated } = options;
  const [status, setStatus] = useState<OrdersSocketStatus>("idle");
  const createdRef = useRef(onOrderCreated);
  const updatedRef = useRef(onOrderUpdated);
  createdRef.current = onOrderCreated;
  updatedRef.current = onOrderUpdated;

  useEffect(() => {
    if (!enabled || !token) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const url = socketBaseUrl();

    const socket: Socket = io(url, {
      path: "/socket.io",
      auth: { token },
      // Prefer websocket; fall back to polling if upgrade fails
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setStatus("connected");
      // Ask server to (re)join business rooms after reconnect
      socket.emit("orders:join");
    });

    socket.on("disconnect", () => {
      setStatus("connecting");
    });

    socket.on("connect_error", (err) => {
      console.warn("[orders-socket] connect_error", url, err.message);
      setStatus("error");
    });

    socket.on("orders:joined", () => {
      setStatus("connected");
    });

    socket.on("order:created", (order: Order) => {
      createdRef.current?.(order);
    });

    socket.on("order:updated", (order: Order | { id: string; deleted?: boolean }) => {
      updatedRef.current?.(order);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setStatus("idle");
    };
  }, [enabled, token]);

  return { status };
}
