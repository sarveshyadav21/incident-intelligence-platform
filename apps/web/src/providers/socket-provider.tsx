"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { socket } from "../lib/socket";

type SocketContextType = {
  socket: typeof socket;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket,
  isConnected: false,
});

type Props = {
  children: React.ReactNode;
};

export function SocketProvider({ children }: Props) {
  const [isConnected, setIsConnected] = useState(() => socket.connected);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
      setIsConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
