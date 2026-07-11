# Socket.IO + TanStack Query — Full Guide

> Real-time event-driven architecture: server broadcasts events via Socket.IO, client receives them via `useSocket` hook, `onEvent` callback decides which TanStack Query to invalidate, `useQuery` refetches, UI updates.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Backend Setup](#3-backend-setup)
4. [Broadcasting from the Server](#4-broadcasting-from-the-server)
5. [Client Setup](#5-client-setup)
6. [TanStack Query Integration](#6-tanstack-query-integration)
7. [Test Endpoints](#7-test-endpoints)
8. [Adding Socket.IO to a New Endpoint](#8-adding-socketio-to-a-new-endpoint)
9. [File Reference](#9-file-reference)
10. [End-to-End Flow](#10-end-to-end-flow)

---

## 1. Overview

### Architecture

```
Server writes to DB
  → socketService.broadcast("event:name", data)
    → Socket.IO emits to all connected clients
      → socket.io-client receives via onAny()
        → onEvent callback fires in the page
          → queryClient.invalidateQueries({ queryKey: ["items"] })
            → useQuery refetches from API
              → UI updates with fresh data
```

### The 3-Layer Rule

| Layer                           | Responsibility                                                            |
| ------------------------------- | ------------------------------------------------------------------------- |
| `useSocket` hook                | Catch all events, store them in `events[]`, call `onEvent`. Nothing else. |
| `onEvent` callback (in page)    | Decide which events invalidate which queries                              |
| `queryClient.invalidateQueries` | Only called inside `onEvent`, only for matching event names               |

The hook **never** imports `QueryClient` or calls `invalidateQueries`. It's a pure event receiver.

### Available Roles

```
super_admin, outlet_admin, worker, driver, customer
```

Each connected socket automatically joins two rooms:

- `role:{role}` — e.g. `role:worker`
- `user:{userId}` — e.g. `user:abc-123-uuid`

---

## 2. Prerequisites

### Installed Packages

**API (`apps/api/package.json`):**

- `socket.io` — Socket.IO server

**Web (`apps/web/package.json`):**

- `socket.io-client` — Socket.IO client
- `@tanstack/react-query` — data fetching + cache management
- `@tanstack/react-query-devtools` — devtools panel

### Environment Variables

**`apps/api/.env`:**

```
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3001"   # used for Socket.IO CORS origin
```

**`apps/web/.env`:**

```
NEXT_PUBLIC_API_URL="http://localhost:3000"     # used for REST API calls
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"  # used for Socket.IO connection
```

---

## 3. Backend Setup

### 3.1 SocketService Class

**File:** `apps/api/src/socket/index.ts`

A singleton class that wraps Socket.IO. Exported as `socketService`.

```ts
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthenticationMiddleware } from "./middleware/authentication";

class SocketService {
  private io: Server | null = null;

  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
    });

    // Auth middleware runs before every connection
    this.io.use(socketAuthenticationMiddleware);

    this.io.on("connection", (socket) => {
      const user = socket.data.user;

      // Auto-join rooms for targeted broadcasting
      if (user?.role) socket.join(`role:${user.role}`);
      if (user?.sub || user?.id) socket.join(`user:${user.sub ?? user.id}`);

      console.log(`Client connected: ${socket.id} (${user?.role})`);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  getIO(): Server {
    if (!this.io)
      throw new Error("Socket.IO not initialized. Call init() first.");
    return this.io;
  }

  // Broadcast to ALL connected clients
  broadcast(eventName: string, data: string) {
    this.getIO().emit(eventName, data);
  }

  // Broadcast to clients with a specific role
  broadcastToRole(role: string, eventName: string, data: string) {
    this.getIO().to(`role:${role}`).emit(eventName, data);
  }

  // Broadcast to a specific user by their user ID
  broadcastToUser(userId: string, eventName: string, data: string) {
    this.getIO().to(`user:${userId}`).emit(eventName, data);
  }
}

export const socketService = new SocketService();
```

### 3.2 Server Bootstrap

**File:** `apps/api/src/server.ts`

Creates the HTTP server and attaches Socket.IO to it.

```ts
import http from "http";
import { App } from "./app";
import { socketService } from "./socket";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = new App();

// Socket.IO needs the raw HTTP server, not the Express app
const server = http.createServer(app.app);

// Attach Socket.IO before starting to listen
socketService.init(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready`);
});
```

**Important:** Use `server.listen()`, not `this.app.listen()`. Socket.IO attaches to the HTTP server for WebSocket upgrade.

### 3.3 Authentication Middleware

**File:** `apps/api/src/socket/middleware/authentication.ts`

Runs before every connection. Verifies the user via JWT cookie or Better Auth session.

**Two auth paths:**

1. **JWT path:** Parses `access_token` cookie → verifies with `jose` → attaches decoded user to `socket.data.user`
2. **Better Auth path:** Falls back to Better Auth session lookup → attaches user to `socket.data.user`

On failure, the connection is rejected with an error message.

**What's on `socket.data.user` after auth:**

```ts
{
  sub: string;       // user id (JWT path)
  id: string;        // user id (Better Auth path)
  email: string;
  role: "super_admin" | "outlet_admin" | "worker" | "driver" | "customer";
  name?: string;
  // ... other fields
}
```

### 3.4 Authorization Middleware

**File:** `apps/api/src/socket/middleware/authorization.ts`

Two patterns available:

**Connection-level** — gate the entire socket (runs in `io.use()`):

```ts
import { socketAuthorizationMiddleware } from "./middleware/authorization";

// Only these roles can connect at all
io.use(socketAuthorizationMiddleware("super_admin", "outlet_admin"));
```

**Per-event** — gate individual events (runs inside `socket.on()`):

```ts
import { assertSocketRole } from "./middleware/authorization";

socket.on("admin-only-event", () => {
  try {
    assertSocketRole(socket, "super_admin", "outlet_admin");
    // ... admin logic
  } catch (err) {
    socket.emit("error", { message: (err as Error).message });
  }
});
```

### 3.5 Room Auto-Join

On connection, each socket automatically joins:

| Room          | Example        | Purpose                        |
| ------------- | -------------- | ------------------------------ |
| `role:{role}` | `role:worker`  | Broadcast to all workers       |
| `user:{id}`   | `user:abc-123` | Broadcast to one specific user |

This happens in `socket/index.ts` inside the `connection` handler:

```ts
if (user?.role) socket.join(`role:${user.role}`);
if (user?.sub || user?.id) socket.join(`user:${user.sub ?? user.id}`);
```

---

## 4. Broadcasting from the Server

### Pattern 1: Broadcast to ALL Clients

Used for events everyone should see (e.g. item updated, schedule changed).

```ts
import { socketService } from "@/socket";

// After a DB write:
socketService.broadcast("item:updated", "item:updated");
```

**Real example** — `apps/api/src/controllers/item.controller.ts`:

```ts
createItem = async (req, res, next) => {
  const item = await this.ItemService.createItem(newItem);
  socketService.broadcast("item:updated", "item:updated");
  res.status(201).json({ success: true, data: item });
};
```

### Pattern 2: Broadcast to a Specific Role

Used for role-specific notifications (e.g. alert only workers).

```ts
import { socketService } from "@/socket";

// Only workers receive this:
socketService.broadcastToRole(
  "worker",
  "worker:alert",
  "Shift starts in 10 minutes",
);

// Only admins receive this:
socketService.broadcastToRole(
  "super_admin",
  "admin:notification",
  "New order pending",
);
```

### Pattern 3: Broadcast to a Specific User

Used for private messages, personal notifications.

```ts
import { socketService } from "@/socket";

// Only user with this ID receives it:
socketService.broadcastToUser(userId, "user:private", "Your order is ready");
```

### Data Must Be Serializable

Socket.IO sends JSON. Always pass strings or `JSON.stringify()` objects:

```ts
// Good
socketService.broadcast("item:updated", "item:updated");
socketService.broadcast("schedule:new", JSON.stringify(scheduleData));

// Bad — objects may not serialize correctly
socketService.broadcast("event", someRawObject);
```

**Real example** — `apps/api/src/services/workerShift.services.ts`:

```ts
socketService.broadcast("ScheduleUpdated", JSON.stringify(res));
```

---

## 5. Client Setup

### 5.1 The `useSocket` Hook

**File:** `apps/web/lib/use-socket.ts`

A pure event receiver. Never touches QueryClient.

```tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export function useSocket({ onEvent }) {
  const [status, setStatus] = useState("disconnected");
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.onAny((eventName, data) => {
      // Store every event
      setEvents((prev) => [
        ...prev,
        { id: crypto.randomUUID(), event: eventName, data, time: new Date() },
      ]);
      // Let the page decide what to do
      onEvent?.(
        eventName,
        typeof data === "string" ? data : JSON.stringify(data),
      );
    });

    socketRef.current = socket;
  }, [onEvent]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus("disconnected");
  }, []);

  return { status, events, connect, disconnect, clearEvents };
}
```

**What it does:**

- Connects to Socket.IO server
- Listens to ALL events via `socket.onAny()`
- Stores events in state for the event log
- Calls `onEvent` callback so the page can react

**What it does NOT do:**

- Does NOT import `QueryClient`
- Does NOT call `invalidateQueries`
- Does NOT filter events by name
- Does NOT know about TanStack Query at all

### 5.2 QueryClientProvider

**File:** `apps/web/app/providers.tsx`

Wraps the entire app with TanQuery Query provider + devtools.

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 5.3 Layout Wrapping

**File:** `apps/web/app/layout.tsx`

The root layout wraps children with `<Providers>`:

```tsx
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 6. TanStack Query Integration

### The Pattern

In any page component:

```tsx
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useSocket } from "@/lib/use-socket";

export default function MyPage() {
  const queryClient = useQueryClient();

  // 1. Define which events trigger which refetches
  const handleEvent = useCallback(
    (eventName: string) => {
      if (eventName === "item:updated") {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }
      if (eventName === "ScheduleUpdated") {
        queryClient.invalidateQueries({ queryKey: ["shifts"] });
      }
    },
    [queryClient],
  );

  // 2. Pass onEvent to the hook
  const { status, events, connect, disconnect } = useSocket({
    onEvent: handleEvent,
  });

  // 3. Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // 4. Fetch data with useQuery
  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: () =>
      fetch("/api/items", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => j.data),
  });

  // 5. Render items — this table auto-updates when socket events arrive
  return (
    <div>
      {items?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### How to Add a New Event Handler

Just add another `if` branch in `onEvent`:

```ts
const handleEvent = useCallback(
  (eventName: string) => {
    if (eventName === "item:updated") {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
    if (eventName === "ScheduleUpdated") {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    }
    // ADD NEW EVENTS HERE:
    if (eventName === "order:created") {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
    if (eventName === "user:notification") {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  },
  [queryClient],
);
```

No hook changes needed. No event name registration. Just add a new `if` branch.

---

## 7. Test Endpoints

Three no-auth endpoints for testing Socket.IO broadcasting:

### 7.1 Broadcast to All Clients

```bash
curl -X POST "http://localhost:3000/api/test/broadcast?eventName=item:updated&data=item:updated"
```

| Param       | Default                    | Description             |
| ----------- | -------------------------- | ----------------------- |
| `eventName` | `test`                     | Event name to broadcast |
| `data`      | `hello from test endpoint` | Payload string          |

**Response:**

```json
{ "success": true, "event": "item:updated", "data": "item:updated" }
```

### 7.2 Broadcast to a Specific Role

```bash
curl -X POST "http://localhost:3000/api/test/broadcast/role?role=worker&eventName=worker:alert&data=shift+starting"
```

| Param       | Required                                 | Description                                 |
| ----------- | ---------------------------------------- | ------------------------------------------- |
| `role`      | Yes                                      | Target role (`worker`, `super_admin`, etc.) |
| `eventName` | No (default: `test`)                     | Event name                                  |
| `data`      | No (default: `hello from test endpoint`) | Payload string                              |

**Response:**

```json
{
  "success": true,
  "role": "worker",
  "event": "worker:alert",
  "data": "shift starting"
}
```

**Error (missing role):**

```json
{ "success": false, "message": "role is required" }
```

### 7.3 Broadcast to a Specific User

```bash
curl -X POST "http://localhost:3000/api/test/broadcast/user?userId=abc-123-uuid&eventName=user:private&data=hello+only+you"
```

| Param       | Required                                 | Description      |
| ----------- | ---------------------------------------- | ---------------- |
| `userId`    | Yes                                      | Target user UUID |
| `eventName` | No (default: `test`)                     | Event name       |
| `data`      | No (default: `hello from test endpoint`) | Payload string   |

**Response:**

```json
{
  "success": true,
  "userId": "abc-123-uuid",
  "event": "user:private",
  "data": "hello only you"
}
```

**Error (missing userId):**

```json
{ "success": false, "message": "userId is required" }
```

### Quick Test Script

```bash
# Terminal 1: Start API
cd apps/api && pnpm dev

# Terminal 2: Start web
cd apps/web && pnpm dev

# Terminal 3: Open browser to http://localhost:3001/(socket.io%20test)/socket
# Login first (socket auth requires cookies), then run:

# Broadcast to all
curl -X POST "http://localhost:3000/api/test/broadcast?eventName=item:updated&data=item:updated"

# Broadcast to workers only
curl -X POST "http://localhost:3000/api/test/broadcast/role?role=worker&eventName=worker:alert&data=check+your+shift"

# Broadcast to a specific user
curl -X POST "http://localhost:3000/api/test/broadcast/user?userId=YOUR_USER_ID&eventName=user:private&data=hello"
```

---

## 8. Adding Socket.IO to a New Endpoint

### Step 1: Server — Broadcast After DB Write

In any controller or service:

```ts
import { socketService } from "@/socket";

// After create/update/delete:
socketService.broadcast("your-event-name", JSON.stringify(yourData));

// Or for role-specific:
socketService.broadcastToRole("worker", "worker:alert", JSON.stringify(data));

// Or for user-specific:
socketService.broadcastToUser(userId, "user:private", JSON.stringify(data));
```

### Step 2: Client — Add Event Handler in `onEvent`

In the page that uses the data:

```tsx
const handleEvent = useCallback(
  (eventName: string) => {
    if (eventName === "item:updated") {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
    // ADD YOUR NEW EVENT:
    if (eventName === "your-event-name") {
      queryClient.invalidateQueries({ queryKey: ["your-query-key"] });
    }
  },
  [queryClient],
);
```

### Step 3: That's It

No hook changes. No event name registration. No new imports. Just add the broadcast on the server and the `if` branch on the client.

---

## 9. File Reference

### Server-Side

| File                                               | Purpose                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/api/src/socket/index.ts`                     | `SocketService` class — `init()`, `getIO()`, `broadcast()`, `broadcastToRole()`, `broadcastToUser()` |
| `apps/api/src/socket/middleware/authentication.ts` | JWT + Better Auth verification before connection                                                     |
| `apps/api/src/socket/middleware/authorization.ts`  | Connection-level and per-event role gating                                                           |
| `apps/api/src/server.ts`                           | Creates HTTP server, attaches Socket.IO, starts listening                                            |
| `apps/api/src/app.ts`                              | Express app with test broadcast endpoints (`/api/test/broadcast/*`)                                  |
| `apps/api/src/controllers/item.controller.ts`      | Broadcasts `"item:updated"` after create/update/delete                                               |
| `apps/api/src/services/workerShift.services.ts`    | Broadcasts `"ScheduleUpdated"` after schedule replacement                                            |

### Client-Side

| File                                            | Purpose                                                  |
| ----------------------------------------------- | -------------------------------------------------------- |
| `apps/web/lib/use-socket.ts`                    | `useSocket` hook — pure event receiver, calls `onEvent`  |
| `apps/web/app/providers.tsx`                    | `QueryClientProvider` + `ReactQueryDevtools` wrapper     |
| `apps/web/app/layout.tsx`                       | Root layout, wraps children with `<Providers>`           |
| `apps/web/app/(socket.io test)/socket/page.tsx` | Demo page — items table, create form, event log          |
| `apps/web/lib/socket.ts`                        | Raw Socket.IO client singleton (not used by `useSocket`) |

### Config

| File            | Relevant Variable                                   |
| --------------- | --------------------------------------------------- |
| `apps/api/.env` | `NEXT_PUBLIC_APP_URL` — Socket.IO CORS origin       |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL` — REST API base URL           |
| `apps/web/.env` | `NEXT_PUBLIC_SOCKET_URL` — Socket.IO connection URL |

---

## 10. End-to-End Flow

### When an Item is Created

```
1.  User types "Handuk" in the form and clicks "Add Item"
2.  Frontend POSTs to POST /api/items with { name: "Handuk" }
3.  Server validates (super_admin auth required)
4.  Server inserts into DB via Prisma
5.  Server calls: socketService.broadcast("item:updated", "item:updated")
6.  Socket.IO emits "item:updated" to ALL connected clients
7.  useSocket.onAny() catches it
8.  onEvent callback fires with ("item:updated", "item:updated")
9.  Your callback checks: eventName === "item:updated" → true
10. queryClient.invalidateQueries({ queryKey: ["items"] })
11. useQuery refetches GET /api/items
12. Items table updates with "Handuk" in the list
13. Event appears in the Event Log with timestamp
```

### When a Role-Specific Event is Emitted

```
1.  Server calls: socketService.broadcastToRole("worker", "worker:alert", "Check schedule")
2.  Socket.IO sends ONLY to sockets in the "role:worker" room
3.  Worker clients receive it via onAny() → onEvent fires → may invalidate queries
4.  Admin/driver/customer clients do NOT receive it (not in the room)
5.  Event only appears in the Event Log for worker clients
```

### When a Test Event is Emitted (Should NOT Refetch)

```
1.  curl POST /api/test/broadcast?eventName=test&data=random
2.  Server broadcasts "test" to all clients
3.  onAny() catches it → onEvent fires with ("test", "random")
4.  Callback checks: "test" === "item:updated" → false
5.  Callback checks: "test" === "ScheduleUpdated" → false
6.  NO invalidation. NO refetch. Items table stays unchanged.
7.  Event DOES appear in the Event Log (onAny catches everything)
```

---

## Key Rules

| Rule                                                    | Why                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `useSocket` is a **pure event receiver**                | It catches all events, stores them, calls `onEvent`. Nothing else. |
| `onEvent` decides what to invalidate                    | Keeps invalidation logic in the page, not the hook                 |
| Only match **exact event names**                        | `eventName === "item:updated"` not `eventName.includes(...)`       |
| The hook **never** imports `QueryClient`                | Separation of concerns — Socket.IO transport vs data fetching      |
| `socket.onAny()` catches ALL events                     | No need to register event names upfront                            |
| `broadcast(name, data)` — data must be serializable     | Socket.IO sends JSON; no raw objects or streams                    |
| Clean up on unmount                                     | `disconnect()` prevents memory leaks                               |
| `socketService.init()` must be called before broadcasts | The HTTP server must exist first                                   |
| Each socket auto-joins `role:` and `user:` rooms        | Enables targeted broadcasting without manual room management       |
