import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Order } from "../types";

function socketBaseUrl() {
  const api = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:5001/api";
  return api.replace(/\/api\/?$/, "");
}

/** Guest / public tracking — no JWT; subscribe to a single order room */
export function useGuestOrderSocket(options: {
  orderId: string | undefined;
  enabled?: boolean;
  onUpdate: (order: Order) => void;
}) {
  const { orderId, enabled = true, onUpdate } = options;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !orderId) return;

    const socket: Socket = io(socketBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      socket.emit("order:subscribe", orderId);
    });

    socket.on("order:updated", (order: Order) => {
      if (order?.id === orderId) onUpdateRef.current(order);
    });
    socket.on("order:created", (order: Order) => {
      if (order?.id === orderId) onUpdateRef.current(order);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [orderId, enabled]);
}
