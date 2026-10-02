import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class DepartmentDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() nameEn?: string;
  /** جهة خارجية: a partner outside the municipality. */
  @IsOptional() @IsBoolean() isExternal?: boolean;
}
