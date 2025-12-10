import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString({ message: 'firstName должен быть строкой' })
  @MaxLength(50, { message: 'firstName максимум 50 символов' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'lastName должен быть строкой' })
  @MaxLength(50, { message: 'lastName максимум 50 символов' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'bio должен быть строкой' })
  @MaxLength(500, { message: 'bio максимум 500 символов' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'language должен быть строкой' })
  @MaxLength(10, { message: 'language максимум 10 символов' })
  language?: string;

  @IsOptional()
  @IsString({ message: 'displayName должен быть строкой' })
  @MaxLength(80, { message: 'displayName максимум 80 символов' })
  displayName?: string;

  // ✅ Не ругаемся на пустую строку,
  // но если значение есть — проверяем URL
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsUrl({}, { message: 'avatarUrl должен быть корректным URL' })
  @MaxLength(500, { message: 'avatarUrl максимум 500 символов' })
  avatarUrl?: string;

  // Вариант строгий под ISO-коды:
  @IsOptional()
  @IsString({ message: 'country должен быть строкой' })
  @Length(2, 2, { message: 'country должен быть кодом из 2 букв (RU, FI, US)' })
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'country должен содержать только латинские буквы (например RU)',
  })
  country?: string;
}