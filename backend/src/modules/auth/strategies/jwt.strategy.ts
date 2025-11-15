// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1) из cookie 'jwt'
        (req: Request) => req?.cookies?.jwt,
        // 2) или из Authorization: Bearer ... (на всякий случай, для Postman)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: cfg.get<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email?: string; role?: string; iat: number }) {
    // тут ты формируешь, что будет в req.user
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}