import { Controller, Get, Query } from '@nestjs/common';
import { Roles, TenantId } from '../common/decorators';
import { AuditService } from './audit.service';

@Controller('audit')
@Roles('ADMIN')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    return this.audit.list(tenantId, Number(page), Number(pageSize));
  }
}
