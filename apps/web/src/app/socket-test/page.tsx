"use client";

import { useEffect } from "react";

import { io } from "socket.io-client";

export default function SocketTestPage() {
  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("incident-progress", (data) => {
      console.log("Progress:", data);
    });

    socket.on("incident-completed", (data) => {
      console.log("AI Result:", data);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Socket Test Running...</div>;
}
