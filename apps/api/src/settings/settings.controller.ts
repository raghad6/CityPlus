import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { UpdateSettingsDto } from './settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@Roles('ADMIN')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  get(@TenantId() tenantId: string) {
    return this.settings.get(tenantId);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @TenantId() tenantId: string, @Body() dto: UpdateSettingsDto) {
    return this.settings.update(user, tenantId, dto);
  }
}
