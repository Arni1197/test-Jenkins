// src/users/dto/update-user-profile.dto.ts
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  country?: string;
}