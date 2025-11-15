// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  Req,
  UnauthorizedException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendConfirmEmailDto } from './dto/resend-confirm-email.dto';

// 👇 Пути подгони под свой проект (если guard в другом месте)

// 👇 Добавим сервис и DTO для 2FA (пути тоже подгони)
import { TwoFaService } from './two-fa.service';
import { TwoFaCodeDto, TwoFaLoginDto } from './dto/two-fa.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly twoFaService: TwoFaService, // 👈 вот так, а не this.TwoFaService
  ) {}

  // ---------- 2FA: шаг 1 — сгенерировать secret + otpauthUrl ----------
// ---------- 2FA: шаг 1 — сгенерировать secret + otpauthUrl ----------
@UseGuards(JwtAuthGuard)
@Post('2fa/setup')
async setup2fa(@Req() req: Request & { user: any }) {
  const { userId, id } = req.user as { userId?: string; id?: string };
  const realUserId = userId ?? id;

  if (!realUserId) {
    throw new UnauthorizedException('Пользователь не найден');
  }

  const data = await this.twoFaService.generateSecretForUser(realUserId);
  return data;
}

// ---------- 2FA: шаг 2 — подтвердить включение 2FA кодом ----------
@UseGuards(JwtAuthGuard)
@Post('2fa/enable')
async enable2fa(@Req() req: Request & { user: any }, @Body() dto: TwoFaCodeDto) {
  const { userId, id } = req.user as { userId?: string; id?: string };
  const realUserId = userId ?? id;

  if (!realUserId) {
    throw new UnauthorizedException('Пользователь не найден');
  }

  await this.twoFaService.enableTwoFa(realUserId, dto.code);
  return { message: '2FA включена' };
}

// ---------- 2FA: шаг 3 — отключить 2FA ----------
@UseGuards(JwtAuthGuard)
@Post('2fa/disable')
async disable2fa(@Req() req: Request & { user: any }, @Body() dto: TwoFaCodeDto) {
  const { userId, id } = req.user as { userId?: string; id?: string };
  const realUserId = userId ?? id;

  if (!realUserId) {
    throw new UnauthorizedException('Пользователь не найден');
  }

  await this.twoFaService.disableTwoFa(realUserId, dto.code);
  return { message: '2FA отключена' };
}

  // ---------- 2FA: шаг 4 — второй шаг логина (код из приложения) ----------
// src/modules/auth/auth.controller.ts
@Post('2fa/login')
async twoFaLogin(
  @Body() dto: TwoFaLoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const { userId, email, username, accessToken, refreshToken } =
    await this.authService.completeTwoFaLogin(dto);

  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: false, // в проде true
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshJwt', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { userId, email, username };
}

  // ---------- Регистрация ----------
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      userId: user._id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
    };
  }

  // ---------- Логин (шаг 1: пароль, 2FA ещё не трогаем) ----------
  @Post('login') // 👈 ЭТОГО НЕ ХВАТАЛО
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    if (result.need2fa) {
      // 2FA включена — токены НЕ выдаём, отдаём только twoFaToken
      return { need2fa: true, twoFaToken: result.twoFaToken };
    }

    const { userId, email, username, accessToken, refreshToken } = result;

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: false, // в проде: true
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshJwt', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { userId, email, username };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    res.clearCookie('refreshJwt');
    return { message: 'Logged out' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request & { cookies: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshJwt } = req.cookies;
    if (!refreshJwt) throw new UnauthorizedException();

    const { accessToken } = await this.authService.refreshToken(refreshJwt);
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user?: any }) {
    return req.user;
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'Если email зарегистрирован, письмо отправлено.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Пароль успешно сброшен.' };
  }

  @Post('confirm-email')
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    await this.emailConfirmationService.confirmEmail(dto.token);
    return { message: 'Email успешно подтверждён.' };
  }

  @Post('resend-confirm-email')
  @HttpCode(200)
  async resendConfirmEmail(@Body() dto: ResendConfirmEmailDto) {
    await this.emailConfirmationService.resendEmailConfirmation(dto.email);
    return {
      message: 'Если email зарегистрирован и не подтверждён, письмо отправлено.',
    };
  }
}