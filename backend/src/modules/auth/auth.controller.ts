import { Body, Controller, Post, Res, Get, Req, UnauthorizedException, HttpCode, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return { userId: user._id, email: user.email, username: user.username };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { userId, email, username, accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: false,
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
  async refresh(@Req() req: Request & { cookies: any }, @Res({ passthrough: true }) res: Response) {
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

  @Get('me')
  async me(@Req() req: Request & { user?: any }) {
    return req.user;
  }

  // --- Новый код для сброса пароля ---
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
}