// src/modules/auth/dto/resend-confirm-email.dto.ts
import { IsEmail } from 'class-validator';

export class ResendConfirmEmailDto {
  @IsEmail()
  email: string;
}