import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, User } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { hashPassword, verifyPassword } from '../../lib/auth/password.util';
import {
  createSessionToken,
  getSessionExpiry,
  hashSessionToken,
} from '../../lib/auth/session.util';
import type {
  AuthenticatedUser,
  AuthSessionPayload,
} from './types/auth-user.type';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly sessionTtlDays: number;
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.sessionTtlDays = this.config.get<number>('SESSION_TTL_DAYS') ?? 7;
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = googleClientId
      ? new OAuth2Client(googleClientId)
      : null;
  }

  toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      provider: user.provider,
      isGuest: user.provider === AuthProvider.GUEST,
    };
  }

  async signup(dto: SignupDto): Promise<AuthSessionPayload> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        passwordHash,
        provider: AuthProvider.EMAIL,
      },
    });

    return this.createSessionForUser(user);
  }

  async login(dto: LoginDto): Promise<AuthSessionPayload> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.provider === AuthProvider.GUEST) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.provider === AuthProvider.GOOGLE || !user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google sign-in. Continue with Google instead.',
      );
    }

    const valid = await verifyPassword(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSessionForUser(user);
  }

  async guestLogin(): Promise<AuthSessionPayload> {
    const guestId = randomUUID().slice(0, 8);
    const user = await this.prisma.user.create({
      data: {
        email: `guest-${guestId}@guest.local`,
        firstName: 'Guest',
        lastName: 'User',
        provider: AuthProvider.GUEST,
      },
    });

    return this.createSessionForUser(user);
  }

  async googleLogin(credential: string): Promise<AuthSessionPayload> {
    if (!this.googleClient) {
      throw new BadRequestException('Google sign-in is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new UnauthorizedException('Google sign-in failed');
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (user) {
      if (user.provider === AuthProvider.GUEST) {
        throw new BadRequestException('Guest accounts cannot link Google');
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          provider: AuthProvider.GOOGLE,
          firstName: payload.given_name ?? user.firstName,
          lastName: payload.family_name ?? user.lastName,
          email,
          passwordHash: null,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          firstName: payload.given_name ?? payload.name ?? 'User',
          lastName: payload.family_name ?? null,
          provider: AuthProvider.GOOGLE,
        },
      });
    }

    return this.createSessionForUser(user);
  }

  async logout(token: string | undefined): Promise<{ loggedOut: boolean }> {
    if (!token) {
      return { loggedOut: true };
    }

    await this.prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });

    return { loggedOut: true };
  }

  async validateSessionToken(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return this.toAuthenticatedUser(session.user);
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthenticatedUser(user);
  }

  private async createSessionForUser(user: User): Promise<AuthSessionPayload> {
    const token = createSessionToken();
    const expiresAt = getSessionExpiry(this.sessionTtlDays);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt,
      },
    });

    return {
      user: this.toAuthenticatedUser(user),
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
