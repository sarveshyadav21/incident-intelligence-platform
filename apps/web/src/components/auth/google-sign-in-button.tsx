"use client";

import { useEffect, useRef } from "react";
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

export function GoogleSignInButton({ onCredential, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!clientId || !containerRef.current || disabled) return;

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;

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
        theme: resolvedTheme === "light" ? "outline" : "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
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
        <ol className="mt-2.5 list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
          <li>
            Create an OAuth <strong className="font-semibold">Web client</strong> in{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
            >
              Google Cloud Console
            </a>
          </li>
          <li>
            Add authorized origin:{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              http://localhost:3000
            </code>
          </li>
          <li>
            Set the same Client ID in{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              apps/web/.env.local
            </code>{" "}
            and{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              apps/api/.env
            </code>
          </li>
          <li>
            Restart{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              pnpm dev
            </code>
          </li>
        </ol>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
