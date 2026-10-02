import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() logoUrl?: string;
  /** Year of the development-plan matrix; default for new projects. */
  @IsOptional() @IsInt() @Min(2000) @Max(2100) planYear?: number;
  /** When false, staff progress reports are applied without admin review. */
  @IsOptional() @IsBoolean() requireApproval?: boolean;
}
