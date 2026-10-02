import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { DepartmentDto } from './departments.dto';
import { DepartmentsService } from './departments.service';

/** Any signed-in user can list departments; only admins change them. */
@Controller('departments')
export class DepartmentsController {
  constructor(private departments: DepartmentsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.departments.list(tenantId);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: AuthUser, @TenantId() tenantId: string, @Body() dto: DepartmentDto) {
    return this.departments.create(user, tenantId, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@CurrentUser() user: AuthUser, @TenantId() tenantId: string, @Param('id') id: string, @Body() dto: DepartmentDto) {
    return this.departments.update(user, tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentUser() user: AuthUser, @TenantId() tenantId: string, @Param('id') id: string) {
    return this.departments.remove(user, tenantId, id);
  }
}
