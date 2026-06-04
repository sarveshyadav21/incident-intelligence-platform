import "./globals.css";

import { QueryProvider } from "../providers/query-provider";
import { SocketProvider } from "../providers/socket-provider";
import { AuthProvider } from "../providers/auth-provider";
import { ThemeProvider } from "../providers/theme-provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>{children}</SocketProvider>
            </AuthProvider>
          </QueryProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
