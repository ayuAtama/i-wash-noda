"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function SocketTest() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected!", socket.id);
    });

    socket.on("hello", (data) => {
      console.log("Received hello:", data);
    });

    socket.on("pong", (data) => {
      console.log("Received pong:", data);
    });

    socket.on("schedule:new", (order) => {
      console.log("Received new order:", order);
    });

    return () => {
      socket.off("connect");
      socket.off("hello");
      socket.off("pong");
      socket.off("schedule:new");
    };
  }, []);

  return (
    <div>
      Socket Test
      <button
        onClick={() => {
          socket.emit("ping", {
            message: "Hello Backend!",
          });
        }}
      >
        Send Ping
      </button>
    </div>
  );
}
