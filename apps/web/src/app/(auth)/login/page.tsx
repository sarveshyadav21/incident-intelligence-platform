"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { loginWithEmail, loginAsGuest, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Welcome back");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      toast.success("Signed in as guest");
    } catch {
      toast.error("Guest login failed");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Signed in with Google");
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Incident Intelligence"
      subtitle="Sign in to analyze and track your incidents"
      footer={
        <AuthFooterLink
          text="New here?"
          href="/signup"
          linkLabel="Create an account"
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="border-zinc-700 bg-zinc-950 text-white"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-10 w-full bg-violet-600 text-white hover:bg-violet-500"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="space-y-3">
        <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />

        <Button
          type="button"
          variant="outline"
          disabled={guestLoading || loading}
          onClick={handleGuest}
          className="h-10 w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          {guestLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Continue as guest"
          )}
        </Button>
      </div>
    </AuthShell>
  );
}
