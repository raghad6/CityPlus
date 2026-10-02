import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { Plan, TenantStatus } from '@prisma/client';

export class CreateTenantDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsString() @Matches(/^[a-z0-9-]{2,40}$/) slug: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(Plan) plan?: Plan;
  @IsOptional() @IsInt() @Min(1) @Max(10000) maxUsers?: number;
  @IsOptional() @IsInt() planYear?: number;
  @IsOptional() @IsBoolean() seedDefaultDepartments?: boolean;
  // First municipality admin
  @IsString() @MinLength(2) adminName: string;
  @IsEmail() adminEmail: string;
  @IsString() @MinLength(8) adminPassword: string;
}

export class UpdateTenantDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(Plan) plan?: Plan;
  @IsOptional() @IsEnum(TenantStatus) status?: TenantStatus;
  @IsOptional() @IsInt() @Min(1) @Max(10000) maxUsers?: number;
}
