import { isUserRole } from "@/types/role";

/**
 * Connection-level authorization middleware for Socket.IO.
 * Use with `io.use()` — runs after auth middleware.
 *
 * @example
 * io.use(socketAuthorizationMiddleware("super_admin", "outlet_admin"));
 */
export function socketAuthorizationMiddleware(...allowedRoles: string[]) {
  return (socket: any, next: (err?: Error) => void) => {
    const role = socket.data.user?.role;

    if (!role) {
      return next(new Error("Unauthorized"));
    }

    if (!isUserRole(role)) {
      return next(new Error("Forbidden: Invalid role"));
    }

    if (!allowedRoles.includes(role)) {
      return next(
        new Error(`Forbidden: only ${allowedRoles.join(", ")} allowed`),
      );
    }

    next();
  };
}

/**
 * Per-event role assertion for use inside `socket.on("event", ...)` handlers.
 * Throws if the socket's role is not in the allowed list.
 *
 * @example
 * socket.on("sensitive-action", () => {
 *   assertSocketRole(socket, "super_admin", "outlet_admin");
 *   // ... handler logic
 * });
 */
export function assertSocketRole(socket: any, ...allowedRoles: string[]) {
  const role = socket.data.user?.role;

  if (!role) {
    const err = new Error("Unauthorized");
    (err as any).data = { code: "UNAUTHORIZED" };
    throw err;
  }

  if (!allowedRoles.includes(role)) {
    const err = new Error(`Forbidden: only ${allowedRoles.join(", ")} allowed`);
    (err as any).data = { code: "FORBIDDEN", allowedRoles };
    throw err;
  }
}
