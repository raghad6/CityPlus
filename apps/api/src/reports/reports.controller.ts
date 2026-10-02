import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { ProgressFieldsDto } from '../projects/projects.dto';
import { ApproveReportDto, RejectReportDto } from './reports.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post('projects/:projectId/reports')
  submit(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('projectId') projectId: string, @Body() dto: ProgressFieldsDto) {
    return this.reports.submit(user, projectId, dto);
  }

  @Get('reports')
  list(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Query('status') status?: string, @Query('projectId') projectId?: string) {
    return this.reports.list(user, { status, projectId });
  }

  @Get('reports/:id')
  get(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string) {
    return this.reports.get(user, id);
  }

  @Post('reports/:id/approve')
  @Roles('ADMIN')
  @HttpCode(200)
  approve(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string, @Body() dto: ApproveReportDto) {
    return this.reports.approve(user, id, dto.note);
  }

  @Post('reports/:id/reject')
  @Roles('ADMIN')
  @HttpCode(200)
  reject(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string, @Body() dto: RejectReportDto) {
    return this.reports.reject(user, id, dto.note);
  }

  @Delete('reports/:id')
  withdraw(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string) {
    return this.reports.withdraw(user, id);
  }
}
