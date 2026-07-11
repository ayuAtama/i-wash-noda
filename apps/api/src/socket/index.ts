import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import { socketAuthenticationMiddleware } from "./middleware/authentication";
import { socketAuthorizationMiddleware } from "./middleware/authorization";

class SocketService {
  private io: Server | null = null;

  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
    });

    this.io.use(socketAuthenticationMiddleware);

    // this.io.use(
    //   socketAuthorizationMiddleware(
    //     "super_admin",
    //     "outlet_admin",
    //     "worker",
    //     "driver",
    //     "customer",
    //   ),
    // );

    this.io.on("connection", (socket) => {
      const user = socket.data.user;
      console.log(
        `Client connected: ${socket.id} (${user?.role ?? "unknown"})`,
        user,
      );

      if (user?.role) socket.join(`role:${user.role}`);
      if (user?.sub || user?.id) socket.join(`user:${user.sub ?? user.id}`);

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

  getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.IO not initialized. Call init() first.");
    }
    return this.io;
  }

  broadcast(eventName: string, data: string) {
    this.getIO().emit(eventName, data);
  }

  broadcastToRole(role: string, eventName: string, data: string) {
    this.getIO().to(`role:${role}`).emit(eventName, data);
  }

  broadcastToUser(userId: string, eventName: string, data: string) {
    this.getIO().to(`user:${userId}`).emit(eventName, data);
  }
}

export const socketService = new SocketService();
