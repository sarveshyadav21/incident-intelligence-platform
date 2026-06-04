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

export default function SignupPage() {
  const { signupWithEmail, loginAsGuest, loginWithGoogle } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signupWithEmail({
        firstName,
        lastName: lastName || undefined,
        email,
        password,
      });
      toast.success("Account created");
    } catch {
      toast.error("Signup failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start mapping incidents to your workspace"
      footer={
        <AuthFooterLink
          text="Already have an account?"
          href="/login"
          linkLabel="Sign in"
        />
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthFormSection className="space-y-4">
          <motion.div
            variants={authFieldVariants}
            className="grid grid-cols-2 gap-3"
          >
            <AuthFormField label="First name">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="border-border bg-background text-foreground"
              />
            </AuthFormField>
            <AuthFormField label="Last name">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-border bg-background text-foreground"
              />
            </AuthFormField>
          </motion.div>

          <AuthFormField label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-border bg-background text-foreground"
            />
          </AuthFormField>

          <AuthFormField
            label="Password"
            hint="At least 8 characters"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="border-border bg-background text-foreground"
            />
          </AuthFormField>

          <motion.div variants={authFieldVariants}>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </motion.div>
        </AuthFormSection>
      </form>

      <AuthDivider />

      <AuthActions>
        <motion.div variants={authFieldVariants}>
          <GoogleSignInButton
            onCredential={async (credential) => {
              setLoading(true);
              try {
                await loginWithGoogle(credential);
                toast.success("Signed up with Google");
              } catch {
                toast.error("Google sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          />
        </motion.div>

        <motion.div variants={authFieldVariants}>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await loginAsGuest();
              } catch {
                toast.error("Guest login failed");
              } finally {
                setLoading(false);
              }
            }}
            className="h-10 w-full border-border bg-transparent text-zinc-200 hover:bg-muted"
          >
            Continue as guest
          </Button>
        </motion.div>
      </AuthActions>
    </AuthShell>
  );
}
