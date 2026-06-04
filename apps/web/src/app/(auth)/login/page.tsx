"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/auth-shell";
import {
  AuthActions,
  AuthDivider,
  AuthFormSection,
} from "@/components/auth/auth-form-section";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { authFieldVariants } from "@/components/auth/auth-motion";
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
      <form onSubmit={handleSubmit}>
        <AuthFormSection className="space-y-4">
          <AuthFormField label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="border-border bg-background text-foreground transition focus:border-violet-500/50"
            />
          </AuthFormField>

          <AuthFormField label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-border bg-background text-foreground transition focus:border-violet-500/50"
            />
          </AuthFormField>

          <motion.div variants={authFieldVariants}>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Sign in"}
            </Button>
          </motion.div>
        </AuthFormSection>
      </form>

      <AuthDivider />

      <AuthActions>
        <motion.div variants={authFieldVariants}>
          <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />
        </motion.div>

        <motion.div variants={authFieldVariants}>
          <Button
            type="button"
            variant="outline"
            disabled={guestLoading || loading}
            onClick={handleGuest}
            className="h-10 w-full border-border bg-transparent text-zinc-200 hover:border-violet-500/30 hover:bg-muted"
          >
            {guestLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Continue as guest"
            )}
          </Button>
        </motion.div>
      </AuthActions>
    </AuthShell>
  );
}
