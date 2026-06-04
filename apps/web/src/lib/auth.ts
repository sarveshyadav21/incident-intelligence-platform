export const SESSION_COOKIE = "iip_session";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  provider: "EMAIL" | "GOOGLE" | "GUEST";
  isGuest: boolean;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
  expiresAt: string;
};

export function setSessionCookie(token: string, expiresAt: string) {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}
