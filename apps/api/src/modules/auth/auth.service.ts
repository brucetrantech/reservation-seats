import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersRepository, SessionsRepository } from '@/database';
import { EnvConfig } from '@/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async login(googleUser: any) {
    let user = await this.usersRepo.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersRepo.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
      });
    }

    return this.generateTokens(user.id);
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const hash = this.hashToken(refreshToken);
    const session = await this.sessionsRepo.findByRefreshTokenHash(hash);

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old session, create new one (rotation)
    await this.sessionsRepo.revoke(session.id);

    return this.generateTokens(session.userId);
  }

  async revokeSession(refreshToken: string) {
    if (!refreshToken) return;
    const hash = this.hashToken(refreshToken);
    await this.sessionsRepo.revokeByTokenHash(hash);
  }

  getFrontendUrl() {
    return this.config.get('FRONTEND_URL');
  }

  private async generateTokens(userId: string) {
    const accessToken = this.signJwt(
      { sub: userId },
      this.config.get('JWT_ACCESS_EXPIRY'),
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await this.sessionsRepo.create({
      userId,
      refreshTokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private signJwt(payload: Record<string, any>, expiresIn: string): string {
    // Using a simple JWT implementation; in production use @nestjs/jwt
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiry(expiresIn);
    const body = Buffer.from(
      JSON.stringify({ ...payload, iat: now, exp }),
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.config.get('JWT_SECRET'))
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)(m|h|d)$/);
    if (!match) return 900; // default 15m
    const [, num, unit] = match;
    const multipliers: Record<string, number> = {
      m: 60,
      h: 3600,
      d: 86400,
    };
    return parseInt(num) * (multipliers[unit] || 60);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
