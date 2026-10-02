import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { AssignProjectsDto, CreateUserDto, ResetPasswordDto, UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@Roles('ADMIN')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query('q') q?: string, @Query('status') status?: string, @Query('departmentId') departmentId?: string) {
    return this.users.list(tenantId, { q, status, departmentId });
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.users.get(tenantId, id);
  }

  @Post()
  create(@CurrentUser() actor: AuthUser, @TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    return this.users.create(actor, tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() actor: AuthUser, @TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(actor, tenantId, id, dto);
  }

  @Put(':id/projects')
  assign(@CurrentUser() actor: AuthUser, @TenantId() tenantId: string, @Param('id') id: string, @Body() dto: AssignProjectsDto) {
    return this.users.assignProjects(actor, tenantId, id, dto.projectIds);
  }

  @Post(':id/password')
  resetPassword(@CurrentUser() actor: AuthUser, @TenantId() tenantId: string, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.users.resetPassword(actor, tenantId, id, dto.password);
  }

  @Delete(':id')
  remove(@CurrentUser() actor: AuthUser, @TenantId() tenantId: string, @Param('id') id: string) {
    return this.users.remove(actor, tenantId, id);
  }
}
