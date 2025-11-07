import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS } from '../redis/redis.constants';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserDocument } from '../../schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(REDIS) private readonly redisClient: Redis,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) { }

  // -------------------------
  // Регистрация
  // -------------------------
  async register(dto: { email: string; username: string; password: string }): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersService.createUser({ ...dto, password: hashedPassword });
  }

  // -------------------------
  // Логин
  // -------------------------
  async login(dto: { email: string; password: string }) {
    const maxAttempts = 5;
    const blockTimeSeconds = 60 * 15;
    const attemptsKey = `login_attempts:${dto.email}`;
    const attempts = await this.redisClient.get(attemptsKey);

    if (attempts && Number(attempts) >= maxAttempts) {
      throw new UnauthorizedException('Too many login attempts');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      await this.redisClient.incr(attemptsKey);
      await this.redisClient.expire(attemptsKey, blockTimeSeconds);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.redisClient.incr(attemptsKey);
      await this.redisClient.expire(attemptsKey, blockTimeSeconds);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redisClient.del(attemptsKey);

    const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return { userId: user.id, email: user.email, username: user.username, accessToken, refreshToken };
  }

  // -------------------------
  // Обновление access token через refresh token
  // -------------------------
  async refreshToken(token: string) {
    try {
      const payload = this.tokenService.verifyRefreshToken(token) as { sub: string };
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // -------------------------
  // Сброс пароля
  // -------------------------
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const ttlSeconds = Number(this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 60)) * 60;

    await this.redisClient.set(`reset:${tokenHash}`, user.id, 'EX', ttlSeconds);

    const resetUrl = `${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${rawToken}`;
    const html = `<p>Привет, ${user.username}!</p>
                  <p>Чтобы сбросить пароль, перейдите по ссылке:</p>
                  <a href="${resetUrl}">${resetUrl}</a>
                  <p>Если вы не запрашивали сброс — проигнорируйте это письмо.</p>`;

    await this.mailService.sendMail(user.email, 'Сброс пароля', html);
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await this.redisClient.get(`reset:${tokenHash}`);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.redisClient.del(`reset:${tokenHash}`);
  }
}