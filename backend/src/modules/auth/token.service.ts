import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private parseTtl(raw: string | number | undefined): number {
    if (!raw) throw new Error('TTL env is missing');
    if (typeof raw === 'number') return raw;
    const s = String(raw).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const match = /^(\d+)\s*([smhd])$/i.exec(s);
    if (!match) throw new Error(`Invalid TTL format: "${s}"`);
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mul = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return value * mul;
  }

  private resolveTtl(key: 'JWT_ACCESS_TTL' | 'JWT_REFRESH_TTL'): number {
    const raw = this.config.get<string | number>(key);
    return this.parseTtl(raw);
  }

  generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
        expiresIn: this.resolveTtl('JWT_ACCESS_TTL'),
      },
    );
  }

  generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: this.resolveTtl('JWT_REFRESH_TTL'),
      },
    );
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verify(token, { secret: this.config.get<string>('JWT_ACCESS_SECRET')! });
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, { secret: this.config.get<string>('JWT_REFRESH_SECRET')! });
  }
}