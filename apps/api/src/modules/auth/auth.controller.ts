import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '../../lib/auth/public.decorator';
import { CurrentUser } from '../../lib/auth/current-user.decorator';
import { SESSION_COOKIE_NAME } from '../../lib/auth/session.util';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { AuthenticatedUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.signup(dto);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return session;
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return session;
  }

  @Public()
  @Post('guest')
  async guest(@Res({ passthrough: true }) res: Response) {
    const session = await this.authService.guestLogin();
    this.setSessionCookie(res, session.token, session.expiresAt);
    return session;
  }

  @Public()
  @Post('google')
  async google(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.googleLogin(dto.credential);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return session;
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.extractToken(req);
    await this.authService.logout(token);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return { loggedOut: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser | undefined) {
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.getMe(user.id);
  }

  private setSessionCookie(
    res: Response,
    token: string,
    expiresAt: string,
  ): void {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAt),
      path: '/',
    });
  }

  private extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    return req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  }
}
