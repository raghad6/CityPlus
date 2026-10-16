import { IsIn, IsOptional, Matches } from 'class-validator';

/** On-demand report: local dates, both included. */
export class CreateSummaryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) from: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) to: string;
  @IsOptional() @IsIn(['WEEKLY', 'MONTHLY', 'CUSTOM']) kind?: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
}
