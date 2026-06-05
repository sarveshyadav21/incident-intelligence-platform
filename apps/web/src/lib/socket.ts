import { io } from "socket.io-client";

const wsUrl =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export const socket = io(wsUrl, {
  autoConnect: false,
});
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("🚨 Connection Error:", err.message);
});
