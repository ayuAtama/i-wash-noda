"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";

const SSE_URL =
  process.env.NEXT_PUBLIC_SSE_URL || "http://localhost:3000/api/sse";

export type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

export interface SSEEvent {
  id: string;
  event: string;
  data: string;
  time: Date;
}

interface UseSSEOptions {
  queryClient: QueryClient;
  eventNames: string[];
  queryKey?: string[];
}

export function useSSE({ queryClient, eventNames, queryKey }: UseSSEOptions) {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    setStatus("connecting");
    const es = new EventSource(SSE_URL);

    es.onopen = () => setStatus("connected");

    const pushEvent = (eventName: string, e: MessageEvent) => {
      setEvents((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          event: eventName,
          data: e.data,
          time: new Date(),
        },
      ]);
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    es.addEventListener("message", (e: MessageEvent) => {
      pushEvent("message", e);
    });

    for (const name of eventNames) {
      es.addEventListener(name, (e: MessageEvent) => {
        pushEvent(name, e);
      });
    }

    es.onerror = () => {
      setStatus("error");
      es.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = es;
  }, [queryClient, eventNames, queryKey]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setStatus("disconnected");
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return { status, events, connect, disconnect, clearEvents };
}
