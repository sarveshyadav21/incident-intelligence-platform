"use client";

import { useEffect, useRef } from "react";

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
        theme: "filled_black",
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
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
        <p className="font-medium text-amber-200">Google sign-in not configured</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-100/90">
          <li>
            Create an OAuth <strong>Web client</strong> in{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 underline"
            >
              Google Cloud Console
            </a>
          </li>
          <li>
            Add authorized origin: <code className="text-amber-50">http://localhost:3000</code>
          </li>
          <li>
            Set the same Client ID in{" "}
            <code className="text-amber-50">apps/web/.env.local</code> and{" "}
            <code className="text-amber-50">apps/api/.env</code>
          </li>
          <li>Restart <code className="text-amber-50">pnpm dev</code></li>
        </ol>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
