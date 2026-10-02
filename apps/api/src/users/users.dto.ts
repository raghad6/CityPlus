import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsIn(['ADMIN', 'STAFF']) role?: 'ADMIN' | 'STAFF';
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) projectIds?: string[];
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsIn(['ADMIN', 'STAFF']) role?: 'ADMIN' | 'STAFF';
  @IsOptional() @IsString() departmentId?: string | null;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsIn(['PENDING', 'ACTIVE', 'DISABLED']) status?: 'PENDING' | 'ACTIVE' | 'DISABLED';
}

export class AssignProjectsDto {
  @IsArray() @IsString({ each: true }) projectIds: string[];
}

export class ResetPasswordDto {
  @IsString() @MinLength(8) password: string;
}
