// src/modules/auth/dto/two-fa.dto.ts
import { IsString, Length } from 'class-validator';

export class TwoFaCodeDto {
  @IsString()
  @Length(6, 6, { message: 'Код должен быть 6 цифр' })
  code: string;
}

export class TwoFaLoginDto {
  @IsString()
  twoFaToken: string;

  @IsString()
  @Length(6, 6, { message: 'Код должен быть 6 цифр' })
  code: string;
}