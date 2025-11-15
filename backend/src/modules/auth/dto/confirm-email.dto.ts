// src/modules/auth/dto/confirm-email.dto.ts
import { IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  token: string;
}