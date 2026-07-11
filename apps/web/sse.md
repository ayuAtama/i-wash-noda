# SSE Implementation Guide

SSE is a **notification channel**, not a data pipe. When something changes on the server, it pushes an event name. The client receives it and invalidates the relevant TanStack Query, which auto-refetches fresh data from the REST endpoint.

```
POST /api/items  →  DB insert  →  SSE broadcasts "item:updated"
                                          ↓
                              EventSource receives "item:updated"
                                          ↓
                        queryClient.invalidateQueries(["items"])
                                          ↓
                        useQuery re-fetches GET /api/items → UI updates
```

---

## Part 1: Server-Side (Express + better-sse)

### 1.1 SSE Service (singleton)

```ts
// apps/api/src/services/sse.services.ts
import { createChannel } from "better-sse";

class SSEService {
  private readonly channel = createChannel();

  broadcast(...args: Parameters<typeof this.channel.broadcast>) {
    return this.channel.broadcast(...args);
  }

  register(...args: Parameters<typeof this.channel.register>) {
    return this.channel.register(...args);
  }
}

export const sseService = new SSEService();
```

### 1.2 SSE Controller

```ts
// apps/api/src/controllers/sse.controller.ts
import { createSession } from "better-sse";
import type { Request, Response, NextFunction } from "express";
import { sseService } from "@/services/sse.services";

export class SSEController {
  private SSE: typeof sseService;

  constructor(sseservice: typeof sseService) {
    this.SSE = sseservice;
  }

  connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await createSession(req, res);
      this.SSE.register(session);
    } catch (error) {
      next(error);
    }
  };

  sendData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.data;
      // Broadcast event name only — client uses it to know which query to invalidate
      this.SSE.broadcast(query, "item:updated");
      res.json({
        success: true,
        message: "Data sent successfully",
        data: query,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 1.3 Broadcast after a DB write

The key pattern: after any mutation (create/update/delete), broadcast the event name.

```ts
// In any controller or service:
import { sseService } from "@/services/sse.services";

// After Prisma create/update/delete:
const item = await prisma.item.create({ data: { name: "New Item" } });

// Notify all connected clients
sseService.broadcast("item:updated", "item:updated");

return item;
```

The first argument is the data (string), the second is the event name. For this pattern, both are the same string — the event name.

---

## Part 2: Client-Side (Next.js + TanStack Query)

### 2.1 Install

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools --filter web
```

### 2.2 Providers

```tsx
// apps/web/app/providers.tsx
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

### 2.3 useSSE hook

```tsx
// apps/web/lib/use-sse.ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";

const SSE_URL =
  process.env.NEXT_PUBLIC_SSE_URL || "http://localhost:3000/api/sse";

export type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseSSEOptions {
  queryClient: QueryClient;
  eventNames: string[];
  queryKey?: string[]; // which query to invalidate when event arrives
}

export function useSSE({ queryClient, eventNames, queryKey }: UseSSEOptions) {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<{
    event: string;
    time: Date;
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    setStatus("connecting");
    const es = new EventSource(SSE_URL);

    es.onopen = () => setStatus("connected");

    for (const name of eventNames) {
      es.addEventListener(name, () => {
        setLastEvent({ event: name, time: new Date() });
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey });
        }
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

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return { status, lastEvent, connect, disconnect };
}
```

### 2.4 Using in a page

```tsx
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSSE } from "@/lib/use-sse";

const API_URL = "http://localhost:3000";

function fetchItems() {
  return axios.get(`${API_URL}/api/items`).then((r) => r.data);
}

function createItem(name: string) {
  return axios.post(
    `${API_URL}/api/items`,
    { name },
    { withCredentials: true },
  );
}

export default function MyPage() {
  const queryClient = useQueryClient();

  // 1. Fetch data via TanStack Query
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });

  // 2. Connect SSE — on event, invalidate the query → auto-refetch
  const { status, connect, disconnect } = useSSE({
    queryClient,
    eventNames: ["item:updated"],
    queryKey: ["items"],
  });

  // 3. Mutation hits the real API — server broadcasts SSE after DB write
  const mutation = useMutation({
    mutationFn: (name: string) => createItem(name),
  });

  return (
    <div>
      <p>Status: {status}</p>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>

      <input id="name" />
      <button
        onClick={() => mutation.mutate(document.getElementById("name")!.value)}
      >
        Create Item
      </button>

      <ul>
        {data?.data?.map((item: any) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Part 3: Adding SSE to Any New Endpoint

### Step-by-step

1. **Add broadcast to your controller** after any DB write:

```ts
import { sseService } from "@/services/sse.services";

// After create/update/delete:
sseService.broadcast("your-resource:updated", "your-resource:updated");
```

2. **On the client**, add the event name and query key:

```tsx
const { status } = useSSE({
  queryClient,
  eventNames: ["your-resource:updated"],
  queryKey: ["your-resource"],
});
```

3. **Wire up useQuery** for the data:

```tsx
const { data } = useQuery({
  queryKey: ["your-resource"],
  queryFn: () => fetch(`${API_URL}/api/your-resource`).then((r) => r.json()),
});
```

That's it. The flow:

```
Server writes to DB → broadcasts event → EventSource receives →
invalidateQueries → useQuery refetches → UI updates
```

### Key rules

| Rule                                                 | Why                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| SSE carries **event name only**, not data            | Keeps it lightweight; TanStack Query is the source of truth                    |
| Always pass `sseService` to controllers              | Constructor requires it — crashes without it                                   |
| `broadcast(data, eventName)` — data must be a string | `better-sse` sends raw strings                                                 |
| `EventSource` only supports `GET`                    | SSE is one-way push; mutations go through regular POST/PUT                     |
| `EventSource` auto-reconnects                        | Browsers retry on network errors automatically                                 |
| Clean up `EventSource` on unmount                    | Prevents memory leaks                                                          |
| Use `invalidateQueries`, not `refetchQueries`        | `invalidateQueries` is smarter — only refetches if the query is active/mounted |
