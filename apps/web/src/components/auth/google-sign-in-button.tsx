"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Props = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

const GSI_SCRIPT_ID = "google-gsi-client";

export function GoogleSignInButton({ onCredential, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const { resolvedTheme } = useTheme();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || disabled) {
      setStatus(clientId ? "loading" : "error");
      return;
    }

    if (!containerRef.current) return;

    setStatus("loading");
    setErrorMessage(null);

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) {
        setStatus("error");
        setErrorMessage("Google script loaded but Sign-In API is unavailable.");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              onCredential(response.credential);
            }
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });

        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to render Google button.",
        );
      }
    };

    const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.id = GSI_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    script.onerror = () => {
      setStatus("error");
      setErrorMessage(
        "Could not load Google Sign-In. Your network may block accounts.google.com (common on company VPN/firewall).",
      );
    };
    document.body.appendChild(script);

    const timeout = window.setTimeout(() => {
      setErrorMessage(
        "Google Sign-In timed out. If accounts.google.com is blocked on your company network, use email/password or guest login instead.",
      );
      setStatus((current) => (current === "loading" ? "error" : current));
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [clientId, disabled, onCredential, resolvedTheme]);

  if (!clientId) {
    return (
      <div
        className="
          rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3.5
          text-sm text-amber-950
          dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50
        "
      >
        <p className="font-semibold text-amber-900 dark:text-amber-100">
          Google sign-in not configured
        </p>
        <p className="mt-2 text-[13px] text-amber-900/90 dark:text-amber-100/90">
          Set <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{" "}
          <code className="font-mono text-xs">apps/web/.env.local</code>, then restart{" "}
          <code className="font-mono text-xs">pnpm dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[44px] flex-col items-center justify-center gap-2">
      {status === "loading" ? (
        <p className="text-xs text-muted-foreground">Loading Google Sign-In…</p>
      ) : null}

      <div ref={containerRef} className="flex min-h-[44px] justify-center" />

      {status === "error" && errorMessage ? (
        <div className="w-full rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
          <p className="font-medium">Google button could not load</p>
          <p className="mt-1">{errorMessage}</p>
          <p className="mt-2 text-[11px] opacity-90">
            In Google Cloud Console → Credentials → your OAuth Web client, add{" "}
            <strong>Authorized JavaScript origins</strong>:{" "}
            <code className="font-mono">
              {typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000"}
            </code>
          </p>
        </div>
      ) : null}
    </div>
  );
}
