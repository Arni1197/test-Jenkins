// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
// import UsersService при необходимости

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly cfg: ConfigService /*, private readonly users: UsersService */) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // или из cookies
      secretOrKey: cfg.get<string>('JWT_ACCESS_SECRET'),        // 👈 access-secret
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email?: string; role?: string; iat: number }) {
    // при желании подтягиваем пользователя и сверяем passwordChangedAt
    // const user = await this.users.findById(payload.sub);
    // if (!user) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}