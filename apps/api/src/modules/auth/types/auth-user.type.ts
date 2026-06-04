import type { AuthProvider } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  provider: AuthProvider;
  isGuest: boolean;
};

export type AuthSessionPayload = {
  user: AuthenticatedUser;
  token: string;
  expiresAt: string;
};
