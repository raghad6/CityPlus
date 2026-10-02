import { Controller, Get, Query } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  @Roles('ADMIN')
  admin(@TenantId() tenantId: string, @Query('planYear') planYear?: string) {
    return this.dashboard.admin(tenantId, planYear);
  }

  @Get('calendar')
  calendar(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Query('month') month?: string) {
    return this.dashboard.calendar(user, month);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser, @TenantId() _t: string) {
    return this.dashboard.me(user);
  }
}
