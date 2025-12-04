import { Type } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, Min } from 'class-validator';

export class ListItemsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsBooleanString()
  isActive?: string; // "true" / "false"
}