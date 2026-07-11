# SSE + TanStack Query — Full Tutorial

SSE is a **notification channel**. The server pushes event names, the client catches **all** of them, and decides which ones should trigger a TanStack Query refetch.

```
Server writes to DB → broadcasts event name →
  eventsource-client catches it (any name) →
    onEvent callback decides → invalidate query →
      useQuery refetches → UI updates
```

---

## Architecture: Why the hook must NOT own invalidation

This is the most important design decision. There are two ways to build this:

### Wrong approach (DO NOT DO THIS)

```tsx
// BAD: hook invalidates on every event
function useSSE({ queryKey }) {
  onMessage: ({ data, event }) => {
    // This runs for EVERY event — "message", "item:updated", "anything"
    queryClient.invalidateQueries({ queryKey });
  };
}
```

**Problem**: If the hook invalidates on every event, your items list refetches when someone sends a `"message"` event, a `"heartbeat"` event, or any random event. Every SSE message triggers a network request. Your items table flickers constantly.

### Correct approach

```tsx
// GOOD: hook is a dumb event receiver
function useSSE({ onEvent }) {
  onMessage: ({ data, event }) => {
    setEvents([...]);  // always store the event (for the log)
    onEvent?.(eventName, data);  // let the consumer decide
  }
}

// Page decides what to do
useSSE({
  onEvent: (eventName) => {
    if (eventName === "item:updated") {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
    // "message" events? ignored. "heartbeat" events? ignored.
  },
});
```

**Why this works**: The hook catches ALL events (for the event log), but only fires `onEvent` — it never touches the query cache. The page's `onEvent` callback decides which events should trigger which refetches. `"message"` events from the initial connection? Ignored. Random test events from curl? Ignored. Only `"item:updated"` triggers the items refetch.

### The rule

| Layer                           | Responsibility                                              |
| ------------------------------- | ----------------------------------------------------------- |
| `useSSE` hook                   | Catch all events, store them in `events[]`, call `onEvent`  |
| `onEvent` callback (in page)    | Decide which events invalidate which queries                |
| `queryClient.invalidateQueries` | Only called inside `onEvent`, only for matching event names |

The hook **never** imports `QueryClient` or calls `invalidateQueries`. It's a pure event receiver.

---

## Part 1: Server-Side (Express + better-sse)

### 1.1 Install

```bash
pnpm add better-sse --filter api
```

### 1.2 SSE Service (singleton)

A shared channel that all controllers can broadcast to.

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

### 1.3 SSE Controller

Two handlers:

- `connect` — client hits `GET /`, creates a session and registers it to the shared channel
- `sendData` — any code calls `broadcast()` to push to all connected clients

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
      this.SSE.broadcast(query);
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

### 1.4 Routes

```ts
// apps/api/src/routes/sse.routes.ts
import { Router } from "express";
import { SSEController } from "@/controllers/sse.controller";
import { sseService } from "@/services/sse.services";

export class PickupRequestRoute {
  public router = Router();
  private controller: SSEController;

  constructor() {
    this.controller = new SSEController(sseService);
    this.router.get("/", this.controller.connect);
    this.router.post("/", this.controller.sendData);
  }
}

export default new PickupRequestRoute().router;
```

### 1.5 Register in app.ts

```ts
import sseRoutes from "@/routes/sse.routes";
this.app.use("/api/sse", sseRoutes);
```

### 1.6 Broadcast from any controller after a DB write

```ts
import { sseService } from "@/services/sse.services";

// After Prisma create/update/delete:
const item = await prisma.item.create({ data: { name: "New Item" } });

// Notify all connected clients
sseService.broadcast("item:updated", "item:updated");

return item;
```

`broadcast(data, eventName)`:

- First arg = data (string)
- Second arg = event name (what the client receives as the `event` field)

---

## Part 2: Client-Side (Next.js + eventsource-client + TanStack Query)

### 2.1 Install

```bash
pnpm add eventsource-client @tanstack/react-query @tanstack/react-query-devtools --filter web
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

Wrap root layout:

```tsx
// apps/web/app/layout.tsx
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 2.3 useSSE hook

```tsx
// apps/web/lib/use-sse.ts
"use client";
import { useRef, useState, useCallback } from "react";
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

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    setStatus("connecting");

    const es = createEventSource({
      url: SSE_URL,
      onMessage: ({ data, event }: EventSourceMessage) => {
        const eventName = event || "message";
        setStatus("connected");

        // Always store the event — this powers the event log
        setEvents((prev) => [
          ...prev,
          { id: crypto.randomUUID(), event: eventName, data, time: new Date() },
        ]);

        // Let the consumer decide what to do — NOT the hook
        onEvent?.(eventName, data);
      },
    });

    esRef.current = es;
  }, [onEvent]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("disconnected");
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { status, events, connect, disconnect, clearEvents };
}
```

**What this does**:

- Uses `eventsource-client` (built on `fetch` + `ReadableStream`, not native `EventSource`)
- `onMessage` catches **ALL events** regardless of event name
- `event` field contains the actual event name dynamically (or `"message"` for unnamed events)
- `onEvent` callback lets the **consumer** decide what to do — the hook never touches query cache

**What this does NOT do**:

- It does NOT import `QueryClient`
- It does NOT call `invalidateQueries`
- It does NOT know about TanStack Query at all
- It does NOT filter events by name

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

  // Fetch data via TanStack Query
  const { data } = useQuery({ queryKey: ["items"], queryFn: fetchItems });

  // Connect SSE — ALL events are caught, only specific ones trigger refetch
  const { status, events, connect, disconnect } = useSSE({
    onEvent: (eventName) => {
      // ONLY invalidate when the event name matches
      if (eventName === "item:updated") {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }
      // "message" events from connection? Ignored.
      // Random test events from curl? Ignored.
      // Only "item:updated" triggers the refetch.
    },
  });

  // Mutation hits the real API — server broadcasts SSE after DB write
  const mutation = useMutation({
    mutationFn: (name: string) => createItem(name),
  });

  return (
    <div>
      <p>SSE: {status}</p>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>

      <h3>Event Log ({events.length})</h3>
      {events.map((e) => (
        <div key={e.id}>
          <strong>{e.event}</strong> — {e.data} — {e.time.toLocaleTimeString()}
        </div>
      ))}

      <h3>Items</h3>
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

### Server side — broadcast after DB write

```ts
// In any controller or service:
import { sseService } from "@/services/sse.services";

// After create/update/delete:
sseService.broadcast("your-event-name", "your-event-name");
```

### Client side — add event handler in onEvent

```tsx
const { status, events, connect, disconnect } = useSSE({
  onEvent: (eventName) => {
    if (eventName === "item:updated") {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
    if (eventName === "order:updated") {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
    if (eventName === "shift:updated") {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    }
  },
});
```

That's it. No hook changes needed. No event name registration. Just add a new `if` branch.

### Testing with curl

```bash
# Trigger a broadcast (server sends this to all connected SSE clients)
curl -X POST "http://localhost:3000/api/sse?data=item:updated"

# Send any random data — it shows in the event log but does NOT trigger refetch
curl -X POST "http://localhost:3000/api/sse?data=anything"
```

---

## How It Works — End to End

### When an item is created (should refetch)

```
1. User creates an item (POST /api/items)
2. Server inserts into DB
3. Server calls: sseService.broadcast("item:updated", "item:updated")
4. better-sse pushes to all connected sessions
5. eventsource-client receives the event via onMessage
6. onMessage fires with { data: "item:updated", event: "item:updated" }
7. Event is added to the events array (shows in event log)
8. onEvent callback fires with ("item:updated", "item:updated")
9. Your callback checks: eventName === "item:updated" → true
10. queryClient.invalidateQueries({ queryKey: ["items"] })
11. TanStack Query refetches GET /api/items
12. Table updates with fresh data
```

### When a test event is sent via curl (should NOT refetch)

```
1. Someone runs: curl -X POST "http://localhost:3000/api/sse?data=anything"
2. Server calls: sseService.broadcast("anything")
3. better-sse pushes to all connected sessions (sends as "message" event)
4. eventsource-client receives the event via onMessage
5. onMessage fires with { data: "anything", event: undefined }
6. eventName defaults to "message"
7. Event is added to the events array (shows in event log)
8. onEvent callback fires with ("message", "anything")
9. Your callback checks: "message" === "item:updated" → false
10. NO invalidation. NO refetch. Items table stays unchanged.
```

### When connecting (should NOT refetch)

```
1. User clicks "Connect"
2. EventSource connects to GET /api/sse
3. Server sends: session.push("Hello world!", "message")
4. onMessage fires with { data: "Hello world!", event: "message" }
5. Event shows in event log as: message — Hello world! — 12:00:00 PM
6. onEvent fires with ("message", "Hello world!")
7. "message" === "item:updated" → false → NO refetch
```

---

## Key Rules

| Rule                                                 | Why                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `useSSE` is a **pure event receiver**                | It catches all events, stores them, calls `onEvent`. Nothing else.       |
| `onEvent` decides what to invalidate                 | Keeps invalidation logic in the page, not the hook                       |
| Only match **exact event names**                     | `eventName === "item:updated"` not `eventName.includes(...)` or wildcard |
| The hook **never** imports `QueryClient`             | Separation of concerns — SSE transport vs data fetching                  |
| `eventsource-client` catches ALL events              | Native `EventSource` can't — it requires known event names upfront       |
| `broadcast(data, eventName)` — data must be a string | `better-sse` sends raw strings                                           |
| Clean up on unmount                                  | `esRef.current?.close()` prevents memory leaks                           |
