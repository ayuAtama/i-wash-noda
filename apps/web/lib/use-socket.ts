"use client";

import { useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export type SocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface SocketEvent {
  id: string;
  event: string;
  data: string;
  time: Date;
}

interface UseSocketOptions {
  onEvent?: (eventName: string, data: string) => void;
}

export function useSocket({ onEvent }: UseSocketOptions = {}) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setStatus("connecting");

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setStatus("connected");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setStatus("error");
    });

    socket.onAny((eventName: string, data: unknown) => {
      const serializedData =
        typeof data === "string" ? data : JSON.stringify(data);

      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          event: eventName,
          data: serializedData,
          time: new Date(),
        },
      ]);

      onEvent?.(eventName, serializedData);
    });

    socketRef.current = socket;
  }, [onEvent]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus("disconnected");
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { status, events, connect, disconnect, clearEvents };
}
