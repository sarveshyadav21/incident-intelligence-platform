"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";
import {
  fetchMe,
  guestLogin,
  googleLogin,
  login,
  logout as logoutApi,
  signup,
} from "@/features/auth/api/auth-api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (input: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(session: AuthSession) {
  setSessionCookie(session.token, session.expiresAt);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearSessionCookie();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const session = await login({ email, password });
      applySession(session);
      setUser(session.user);
      router.push("/incidents");
    },
    [router],
  );

  const signupWithEmail = useCallback(
    async (input: {
      firstName: string;
      lastName?: string;
      email: string;
      password: string;
    }) => {
      const session = await signup(input);
      applySession(session);
      setUser(session.user);
      router.push("/incidents");
    },
    [router],
  );

  const loginAsGuest = useCallback(async () => {
    const session = await guestLogin();
    applySession(session);
    setUser(session.user);
    router.push("/incidents");
  }, [router]);

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const session = await googleLogin(credential);
      applySession(session);
      setUser(session.user);
      router.push("/incidents");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearSessionCookie();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithEmail,
      signupWithEmail,
      loginAsGuest,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      loading,
      loginWithEmail,
      signupWithEmail,
      loginAsGuest,
      loginWithGoogle,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
