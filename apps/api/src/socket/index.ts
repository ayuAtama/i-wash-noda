import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import { socketAuthenticationMiddleware } from "./middleware/authentication";
import { socketAuthorizationMiddleware } from "./middleware/authorization";

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  // ── Global auth: verify every connection via JWT cookie or Better Auth ──
  io.use(socketAuthenticationMiddleware);

  // ── Optional: connection-level role gating ──
  // io.use(
  //   socketAuthorizationMiddleware(
  //     "super_admin",
  //     "outlet_admin",
  //     "worker",
  //     "driver",
  //     "customer",
  //   ),
  // );

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(
      `Client connected: ${socket.id} (${user?.role ?? "unknown"})`,
      user,
    );

    socket.emit("hello", {
      message: "Welcome to Laundry App!",
      time: new Date().toISOString(),
    });

    socket.on("ping", (data) => {
      console.log("Ping received:", data);
      socket.emit("pong", { message: "Hello Frontend!" });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // ── Example: role-gated event handler ──
    // import { assertSocketRole } from "./middleware/authorization";
    //
    // socket.on("admin-only-event", () => {
    //   try {
    //     assertSocketRole(socket, "super_admin", "outlet_admin");
    //     // ... admin logic
    //   } catch (err) {
    //     socket.emit("error", { message: (err as Error).message });
    //   }
    // });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
