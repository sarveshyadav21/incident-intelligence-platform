import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
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
