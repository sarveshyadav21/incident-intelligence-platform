import { createHash, randomBytes } from 'crypto';

export const SESSION_COOKIE_NAME = 'iip_session';

export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiry(days: number): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}
