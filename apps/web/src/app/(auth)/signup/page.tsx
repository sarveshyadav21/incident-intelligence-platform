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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              First name
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Last name
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={8}
            required
            className="border-zinc-700 bg-zinc-950 text-white"
          />
          <p className="text-xs text-zinc-500">At least 8 characters</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-10 w-full bg-violet-600 text-white hover:bg-violet-500"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="space-y-3">
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
          className="h-10 w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          Continue as guest
        </Button>
      </div>
    </AuthShell>
  );
}
