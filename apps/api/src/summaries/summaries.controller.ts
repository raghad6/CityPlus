import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { CreateSummaryDto } from './summaries.dto';
import { SummariesService, SummaryData } from './summaries.service';
import { summaryWorkbook } from './summaries-excel';

@Controller('summaries')
@Roles('ADMIN')
export class SummariesController {
  constructor(private summaries: SummariesService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.summaries.list(tenantId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Body() dto: CreateSummaryDto) {
    return this.summaries.request(user, dto.kind ?? 'CUSTOM', dto.from, dto.to);
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.summaries.get(tenantId, id);
  }

  @Get(':id/export')
  async export(@TenantId() tenantId: string, @Param('id') id: string, @Res() res: Response) {
    const r = await this.summaries.get(tenantId, id);
    const buf = await summaryWorkbook(r.data as unknown as SummaryData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cityplus-report-${r.periodStart.toISOString().slice(0, 10)}.xlsx"`);
    res.send(buf);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string) {
    return this.summaries.remove(user, id);
  }
}
