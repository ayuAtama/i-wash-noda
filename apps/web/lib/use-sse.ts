"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createEventSource, type EventSourceMessage } from "eventsource-client";

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
  onEvent?: (eventName: string, data: string) => void;
}

export function useSSE({ onEvent }: UseSSEOptions = {}) {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const esRef = useRef<ReturnType<typeof createEventSource> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    setStatus("connecting");

    const es = createEventSource({
      url: SSE_URL,
      credentials: "include",
      onMessage: ({ data, event }: EventSourceMessage) => {
        const eventName = event || "message";

        setStatus("connected");

        setEvents((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            event: eventName,
            data,
            time: new Date(),
          },
        ]);

        onEventRef.current?.(eventName, data);
      },
    });

    esRef.current = es;
  }, []);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("disconnected");
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { status, events, connect, disconnect, clearEvents };
}
