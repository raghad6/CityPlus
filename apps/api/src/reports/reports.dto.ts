import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Approve: the review note is optional. */
export class ApproveReportDto {
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

/** Reject: a reason is required so the staff member knows what to fix. */
export class RejectReportDto {
  @IsString() @MinLength(2) @MaxLength(2000) note: string;
}
