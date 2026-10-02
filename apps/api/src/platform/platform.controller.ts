import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { CreateTenantDto, UpdateTenantDto } from './platform.dto';
import { PlatformService } from './platform.service';

@Controller('platform')
@Roles('SUPER_ADMIN')
export class PlatformController {
  constructor(private platform: PlatformService) {}

  @Get('stats')
  stats() {
    return this.platform.stats();
  }

  @Get('tenants')
  tenants() {
    return this.platform.tenants();
  }

  @Get('tenants/:id')
  tenant(@Param('id') id: string) {
    return this.platform.tenant(id);
  }

  @Post('tenants')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTenantDto) {
    return this.platform.create(user, dto);
  }

  @Patch('tenants/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.platform.update(user, id, dto);
  }
}
