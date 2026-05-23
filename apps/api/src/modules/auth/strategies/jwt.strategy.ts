import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { EnvConfig } from '@/config';
import { UsersRepository } from '@/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<EnvConfig, true>,
    private readonly usersRepo: UsersRepository,
  ) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.access_token || null,
      secretOrKey: config.get('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.usersRepo.findById(payload.sub, {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
