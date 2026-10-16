import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf,
} from 'class-validator';
import { AchievementLevel, ProjectStatus } from '@prisma/client';

/** Fields staff may update through a progress report (steps 2–4). */
export class ProgressFieldsDto {
  // Step 2 — المتابعة والتقييم
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) completionPercent?: number;
  @IsOptional() @IsString() @MaxLength(4000) nonExecutionReasons?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsNumber() @Min(0) spentK?: number | null;
  @IsOptional() @IsString() @MaxLength(8000) activities?: string | null;
  // Step 3 — تقييم مستوى الإنجاز
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsEnum(AchievementLevel) achievementLevel?: AchievementLevel | null;
  @IsOptional() @IsString() @MaxLength(500) kpiName?: string | null;
  @IsOptional() @IsString() @MaxLength(200) kpiTarget?: string | null;
  @IsOptional() @IsString() @MaxLength(200) kpiActual?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) evaluationNotes?: string | null;
  // Step 4 — الجهة الممولة
  @IsOptional() @IsString() @MaxLength(300) localBudgetLine?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsNumber() @Min(0) localContributionK?: number | null;
  @IsOptional() @IsString() @MaxLength(300) partnerName?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsNumber() @Min(0) partnerContributionK?: number | null;
}

/** Full project payload — admin only. */
export class ProjectDto extends ProgressFieldsDto {
  // Step 1 — اسم ورقم المشروع
  @IsString() @MinLength(2) @MaxLength(500) programName: string;
  @IsOptional() @IsString() @MaxLength(50) programNumber?: string | null;
  @IsString() @MinLength(2) @MaxLength(500) componentName: string;
  @IsOptional() @IsString() @MaxLength(50) componentNumber?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsNumber() @Min(0) totalCostK?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsNumber() @Min(0) yearCostK?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() planYear?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() departmentId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) extraDepartmentIds?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) assigneeIds?: string[];
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString() startDate?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString() dueDate?: string | null;
}

export class UpdateProjectDto extends PartialType(ProjectDto) {}

export const PROGRESS_FIELDS = [
  'status', 'completionPercent', 'nonExecutionReasons', 'spentK', 'activities',
  'achievementLevel', 'kpiName', 'kpiTarget', 'kpiActual', 'evaluationNotes',
  'localBudgetLine', 'localContributionK', 'partnerName', 'partnerContributionK',
] as const;

/** Delete several projects at once (admin projects list). */
export class BulkDeleteDto {
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(500) @IsString({ each: true }) ids: string[];
}
