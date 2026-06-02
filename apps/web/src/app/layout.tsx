import "./globals.css";

import { QueryProvider } from "../providers/query-provider";
import { SocketProvider } from "../providers/socket-provider";
import { Toaster } from "sonner";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <SocketProvider>{children}</SocketProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
