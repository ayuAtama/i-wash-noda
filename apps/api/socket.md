# Socket.IO — Authentication & Authorization

## How Socket.IO Middleware Differs from Express

| Express                    | Socket.IO                                                       |
| -------------------------- | --------------------------------------------------------------- |
| `(req, res, next)`         | `(socket, next)`                                                |
| `req.cookies.access_token` | `socket.handshake.headers.cookie` (raw string, parsed manually) |
| Attach to `req.user`       | Attach to `socket.data.user`                                    |
| Errors → `next(error)`     | Errors → `next(new Error(...))`                                 |
| Express middleware chain   | `io.use(fn)` — runs **before** every `connection` event         |
| Route-level role gating    | `io.use()` or per-event `assertSocketRole()`                    |

---

## Auth Middleware (`src/socket/middleware/authentication.ts`)

### What it does

1. Parses the `Cookie` header from the handshake HTTP request.
2. Looks for `access_token` cookie → verifies it with `jose` (`verifyToken`).
3. If no JWT cookie, falls back to Better Auth session lookup (social login).
4. On success, attaches user data to `socket.data.user`.
5. On failure, calls `next(new Error("Unauthorized: ..."))` — Socket.IO **rejects the connection**.

### Registration (already done in `src/socket/index.ts`)

```ts
import { socketAuthenticationMiddleware } from "./middleware/authentication";

io.use(socketAuthenticationMiddleware);
```

The middleware is registered **before** the `connection` event, so every connection is authenticated upfront.

### What's on `socket.data.user`

After a successful auth, `socket.data.user` contains:

```ts
{
  // JWT path (from `verifyToken`):
  sub: string; // user id
  email: string;
  role: "super_admin" | "outlet_admin" | "worker" | "driver" | "customer";
  // ... any other JWT claims

  // Better Auth path:
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "super_admin" | "outlet_admin" | "worker" | "driver" | "customer";
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Authorization Middleware (`src/socket/middleware/authorization.ts`)

### Connection-level (gate the entire socket)

Only allow certain roles to connect at all:

```ts
import { socketAuthorizationMiddleware } from "./middleware/authorization";

// Only super_admin and outlet_admin can connect
io.use(socketAuthorizationMiddleware("super_admin", "outlet_admin"));
```

This runs **after** the auth middleware. If the role is not allowed, the connection is rejected.

### Per-event (gate individual events)

Use `assertSocketRole()` inside event handlers when different events need different role levels:

```ts
import { assertSocketRole } from "./middleware/authorization";

io.on("connection", (socket) => {
  socket.on("view-dashboard", () => {
    try {
      assertSocketRole(socket, "super_admin", "outlet_admin");
      // ... dashboard logic
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("update-order-status", () => {
    try {
      assertSocketRole(socket, "super_admin", "outlet_admin", "worker");
      // ... update logic
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("track-delivery", () => {
    try {
      assertSocketRole(socket, "customer", "driver");
      // ... tracking logic
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });
});
```

---

## Client Setup (Next.js / `socket.io-client`)

### `lib/socket.ts`

```ts
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
  withCredentials: true, // ← essential: sends httpOnly cookies with handshake
});
```

The `withCredentials: true` flag tells the browser to include cookies in the Socket.IO handshake HTTP request. Without it, the `access_token` cookie will not reach the server and auth will fail.

### Using in a React component

```tsx
import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function RealtimeDashboard() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected as:", socket.data?.user?.role);
    });

    socket.on("hello", (data) => {
      console.log("Server says:", data.message);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("hello");
      socket.off("error");
    };
  }, []);

  return <div>Connected: {socket.connected ? "yes" : "no"}</div>;
}
```

---

## Middleware Pipeline Order

```ts
io.use(socketAuthenticationMiddleware); // 1. Authenticate (JWT → Better Auth)
io.use(socketAuthorizationMiddleware()); // 2. (optional) Authorize at connection level
io.on("connection", (socket) => {
  // 3. Connection established
  // per-event assertSocketRole()         // 4. (optional) Event-level authorization
});
```

---

## Common Patterns

### Pattern 1: Public + Protected events on the same socket

Some events should be accessible to all authenticated users, others only to admins:

```ts
io.on("connection", (socket) => {
  // Public (any authenticated user)
  socket.on("get-notifications", () => {
    /* ... */
  });

  // Admin-only
  socket.on("get-all-orders", () => {
    try {
      assertSocketRole(socket, "super_admin", "outlet_admin");
      // ...
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });
});
```

### Pattern 2: Room-based authorization (push to specific roles)

Use Socket.IO rooms to scope messages:

```ts
// Join role-based rooms on connection
io.on("connection", (socket) => {
  const role = socket.data.user.role;
  socket.join(`role:${role}`);

  // Later, broadcast to a specific role
  // io.to("role:super_admin").emit("event", data);
});
```

### Pattern 3: Emitting to specific users

```ts
// On connection, join a personal room
io.on("connection", (socket) => {
  const userId = socket.data.user.sub ?? socket.data.user.id;
  socket.join(`user:${userId}`);
});

// Later, emit to a specific user
// getIO().to(`user:${userId}`).emit("private-message", data);
```
