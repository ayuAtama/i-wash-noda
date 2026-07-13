"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { createEventSource, type EventSourceMessage } from "eventsource-client";

const SSE_URL =
  process.env.NEXT_PUBLIC_SSE_URL || "http://localhost:3000/api/sse";

export default function SSEProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const esRef = useRef<ReturnType<typeof createEventSource> | null>(null);
  const [status, setStatus] = React.useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  const onEventRef = useRef((eventName: string) => {
    switch (eventName) {
      case "order:updated":
      case "order:status_changed":
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        queryClient.invalidateQueries({ queryKey: ["worker-available"] });
        queryClient.invalidateQueries({ queryKey: ["worker-history"] });
        break;
      case "order:created":
      case "order:new":
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        break;
      case "pickup_request:created":
      case "pickup_request:updated":
        queryClient.invalidateQueries({ queryKey: ["driver-pickups"] });
        queryClient.invalidateQueries({ queryKey: ["pickup-requests"] });
        break;
      case "delivery_request:created":
      case "delivery_request:updated":
        queryClient.invalidateQueries({ queryKey: ["driver-deliveries"] });
        break;
      case "mismatch:created":
      case "mismatch:updated":
        queryClient.invalidateQueries({ queryKey: ["admin-mismatches"] });
        break;
      case "payment:submitted":
      case "payment:updated":
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        break;
      case "user:created":
      case "user:updated":
      case "user:deleted":
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        break;
      case "outlet:created":
      case "outlet:updated":
      case "outlet:deleted":
        queryClient.invalidateQueries({ queryKey: ["admin-outlets"] });
        break;
      case "item:created":
      case "item:updated":
      case "item:deleted":
      case "item:updated_2":
        queryClient.invalidateQueries({ queryKey: ["admin-items"] });
        break;
      case "schedule:created":
      case "schedule:updated":
        queryClient.invalidateQueries({ queryKey: ["admin-schedule"] });
        break;
    }
  });

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    setStatus("connecting");

    const es = createEventSource({
      url: SSE_URL,
      credentials: "include",
      onMessage: ({ event }: EventSourceMessage) => {
        const eventName = event || "message";
        setStatus("connected");
        onEventRef.current(eventName);
      },
    });

    esRef.current = es;
  }, []);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated, connect, disconnect]);

  return (
    <>
      {isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50" title={`SSE: ${status}`}>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              status === "connected"
                ? "bg-success-500"
                : status === "connecting"
                  ? "bg-warning-500 animate-pulse-soft"
                  : "bg-gray-300"
            }`}
          />
        </div>
      )}
      {children}
    </>
  );
}
