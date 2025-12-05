import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректная почта' })
  email: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть минимум 8 символов' })
  @Matches(/[a-z]/, { message: 'Добавьте хотя бы одну строчную букву' })
  @Matches(/[A-Z]/, { message: 'Добавьте хотя бы одну заглавную букву' })
  @Matches(/[0-9]/, { message: 'Добавьте хотя бы одну цифру' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Добавьте хотя бы один спецсимвол' })
  password: string;
}