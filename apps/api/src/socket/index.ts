// src/socket/index.ts

import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("hello", {
      message: "Welcome to Laundry App!",
      time: new Date().toISOString(),
    });

    // 👇 Add this
    socket.on("ping", (data) => {
      console.log("Ping received:", data);

      socket.emit("pong", {
        message: "Hello Frontend!",
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
