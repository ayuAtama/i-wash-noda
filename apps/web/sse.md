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

A shared channel with typed session state and targeted broadcast helpers.

```ts
// apps/api/src/services/sse.services.ts
import { createChannel, type Session } from "better-sse";
import type { UserRole } from "@/types/role";

export interface SessionState {
  userId: string;
  role: UserRole;
  outletId?: string | null;
}

class SSEService {
  private readonly channel = createChannel<{}, SessionState>();

  broadcast(...args: Parameters<typeof this.channel.broadcast>) {
    return this.channel.broadcast(...args);
  }

  register(...args: Parameters<typeof this.channel.register>) {
    return this.channel.register(...args);
  }

  // ── Targeted broadcast helpers ──────────────────────────────

  broadcastToRole(data: unknown, eventName: string, role: UserRole) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) => session.state.role === role,
    });
  }

  broadcastToOutlet(data: unknown, eventName: string, outletId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.outletId === outletId,
    });
  }

  broadcastToUser(data: unknown, eventName: string, userId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.userId === userId,
    });
  }

  broadcastToRoles(data: unknown, eventName: string, roles: UserRole[]) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        roles.includes(session.state.role),
    });
  }

  broadcastExceptUser(data: unknown, eventName: string, excludeUserId: string) {
    return this.channel.broadcast(data, eventName, {
      filter: (session: Session<SessionState>) =>
        session.state.userId !== excludeUserId,
    });
  }
}

export const sseService = new SSEService();
```

### 1.3 SSE Controller

The `connect` handler authenticates the user and stores their identity in `session.state`. This enables targeted broadcasting via the filter helpers.

```ts
// apps/api/src/controllers/sse.controller.ts
import { createSession } from "better-sse";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma";
import { sseService } from "@/services/sse.services";
import { isUserRole, type UserRole } from "@/types/role";

export class SSEController {
  private SSE: typeof sseervice;

  constructor(sseservice: typeof sseService) {
    this.SSE = sseservice;
  }

  connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const role = (req.access_token?.role ?? req.user?.role) as
        | string
        | undefined;

      if (!userId || !isUserRole(role)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Fetch outlet_id (not available in JWT payload or Better Auth session)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { outlet_id: true },
      });

      const session = await createSession(req, res, {
        state: {
          userId,
          role: role as UserRole,
          outletId: user?.outlet_id ?? null,
        },
      });

      this.SSE.register(session);

      session.push(
        JSON.stringify({ userId, role, outletId: user?.outlet_id ?? null }),
        "connected",
      );
    } catch (error) {
      next(error);
    }
  };

  sendData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.data;
      const eventName = req.query.eventName as string;
      this.SSE.broadcast(query, eventName);
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

The `GET /` endpoint requires `authenticationMiddleware` so each session is tied to a real user. Test endpoints are unauthenticated for easy curl testing.

```ts
// apps/api/src/routes/sse.routes.ts
import { Router } from "express";
import { SSEController } from "@/controllers/sse.controller";
import { sseService } from "@/services/sse.services";
import { authenticationMiddleware } from "@/middleware/authentication";

export class SseRoute {
  public router = Router();
  private controller: SSEController;

  constructor() {
    this.controller = new SSEController(sseService);
    this.createRoutes();
  }

  private createRoutes() {
    // Authenticated SSE stream
    this.router.get("/", authenticationMiddleware, this.controller.connect);
    this.router.post("/", this.controller.sendData);

    // Test broadcast endpoints (no auth)
    this.router.post("/test/all", this.controller.testBroadcastAll);
    this.router.post("/test/role", this.controller.testBroadcastToRole);
    this.router.post("/test/outlet", this.controller.testBroadcastToOutlet);
    this.router.post("/test/user", this.controller.testBroadcastToUser);
    this.router.post("/test/roles", this.controller.testBroadcastToRoles);
    this.router.post("/test/exclude", this.controller.testBroadcastExceptUser);
  }
}

export default new SseRoute().router;
```

### 1.5 Register in app.ts

```ts
import sseRoutes from "@/routes/sse.routes";
this.app.use("/api/sse", sseRoutes);
```

### 1.6 Broadcast from any service after a DB write

```ts
import { sseService } from "@/services/sse.services";

// After Prisma create/update/delete:

// Notify everyone
sseService.broadcast(data, "item:updated");

// Notify only users at the same outlet
sseService.broadcastToOutlet(data, "ScheduleUpdated", outletId);

// Notify only super admins
sseService.broadcastToRole(data, "SystemAlert", "super_admin");

// Notify a specific user
sseService.broadcastToUser(data, "Notification", userId);

// Notify workers and drivers only
sseService.broadcastToRoles(data, "ShiftChange", ["worker", "driver"]);

// Notify everyone except the person who triggered it
sseService.broadcastExceptUser(data, "UserAction", triggeredByUserId);
```

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
      credentials: "include", // REQUIRED for cross-origin cookies
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
- `credentials: "include"` sends cookies cross-origin (port 3001 → 3000) — **required** for auth
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

// After create/update/delete — pick the right helper:

// Everyone
sseService.broadcast(data, "your-event-name");

// Single outlet
sseService.broadcastToOutlet(data, "your-event-name", outletId);

// Single role
sseService.broadcastToRole(data, "your-event-name", "worker");

// Multiple roles
sseService.broadcastToRoles(data, "your-event-name", ["worker", "driver"]);

// Single user
sseService.broadcastToUser(data, "your-event-name", userId);

// Everyone except one user
sseService.broadcastExceptUser(data, "your-event-name", excludeUserId);
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

---

## Part 4: Test Endpoints

Unauthenticated POST endpoints for testing each broadcast filter. All accept an optional `?event=` param to set the event name (defaults shown).

| Endpoint                     | Params                      | What it tests                                     |
| ---------------------------- | --------------------------- | ------------------------------------------------- |
| `POST /api/sse/test/all`     | `?event=`                   | Broadcast to **every** connected client           |
| `POST /api/sse/test/role`    | `?role=` `?event=`          | Broadcast to a **single role**                    |
| `POST /api/sse/test/outlet`  | `?outletId=` `?event=`      | Broadcast to a **single outlet**                  |
| `POST /api/sse/test/user`    | `?userId=` `?event=`        | Broadcast to a **single user**                    |
| `POST /api/sse/test/roles`   | `?roles=` `?event=`         | Broadcast to **multiple roles** (comma-separated) |
| `POST /api/sse/test/exclude` | `?excludeUserId=` `?event=` | Broadcast to **everyone except** one user         |

### Examples

```bash
# Broadcast to all clients with default event name
curl -X POST "http://localhost:3000/api/sse/test/all"

# Broadcast only to workers with custom event name
curl -X POST "http://localhost:3000/api/sse/test/role?role=worker&event=NewOrder"

# Broadcast to everyone at a specific outlet
curl -X POST "http://localhost:3000/api/sse/test/outlet?outletId=<uuid>"

# Broadcast to a specific user
curl -X POST "http://localhost:3000/api/sse/test/user?userId=<uuid>&event=PersonalNotif"

# Broadcast to workers AND drivers
curl -X POST "http://localhost:3000/api/sse/test/roles?roles=worker,driver"

# Broadcast to everyone except the triggering user
curl -X POST "http://localhost:3000/api/sse/test/exclude?excludeUserId=<uuid>"
```

Each returns:

```json
{
  "success": true,
  "message": "Broadcast to role \"worker\" only [event: NewOrder]"
}
```

---

## How It Works — End to End

### When an item is created (should refetch)

```
1. User creates an item (POST /api/items)
2. Server inserts into DB
3. Server calls: sseService.broadcast(data, "item:updated")
4. better-sse pushes to all connected sessions
5. eventsource-client receives the event via onMessage
6. onMessage fires with { data: ..., event: "item:updated" }
7. Event is added to the events array (shows in event log)
8. onEvent callback fires with ("item:updated", ...)
9. Your callback checks: eventName === "item:updated" → true
10. queryClient.invalidateQueries({ queryKey: ["items"] })
11. TanStack Query refetches GET /api/items
12. Table updates with fresh data
```

### When a schedule is updated (should only refetch for that outlet)

```
1. Admin updates a worker's schedule
2. Server writes to DB
3. Server calls: sseService.broadcastToOutlet(data, "ScheduleUpdated", outletId)
4. better-sse checks each session's state.outletId
5. Only sessions matching the outlet receive the event
6. Workers at other outlets? NOT notified.
7. Same-outlet clients: onEvent fires → invalidate schedules query → UI updates
```

### When connecting (should NOT refetch)

```
1. User clicks "Connect"
2. EventSource connects to GET /api/sse (with credentials: "include")
3. Server authenticates (reads access_token cookie)
4. Server creates session with state: { userId, role, outletId }
5. Server sends: session.push(JSON.stringify({...}), "connected")
6. onMessage fires with { data: "...", event: "connected" }
7. Event shows in event log
8. onEvent fires with ("connected", ...)
9. "connected" === "item:updated" → false → NO refetch
```

---

## Key Rules

| Rule                                             | Why                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `useSSE` is a **pure event receiver**            | It catches all events, stores them, calls `onEvent`. Nothing else.       |
| `onEvent` decides what to invalidate             | Keeps invalidation logic in the page, not the hook                       |
| Only match **exact event names**                 | `eventName === "item:updated"` not `eventName.includes(...)` or wildcard |
| The hook **never** imports `QueryClient`         | Separation of concerns — SSE transport vs data fetching                  |
| `eventsource-client` catches ALL events          | Native `EventSource` can't — it requires known event names upfront       |
| `credentials: "include"` is required             | Cross-origin (port 3001 → 3000) needs explicit credential passing        |
| Use `broadcastToOutlet` for outlet-scoped events | Workers only see updates for their outlet, not every outlet              |
| Use `broadcastToRole` for role-scoped events     | Customers don't see admin notifications                                  |
| `event=` query param on test endpoints           | Set custom event names when testing via curl                             |
| Clean up on unmount                              | `esRef.current?.close()` prevents memory leaks                           |
