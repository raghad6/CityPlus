import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthUser, CurrentUser, Roles, TenantId } from '../common/decorators';
import { ProjectDto, UpdateProjectDto } from './projects.dto';
import { ProjectQuery, ProjectsService } from './projects.service';
import { ProjectsExcelService } from './projects-excel.service';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService, private excel: ProjectsExcelService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Query() q: ProjectQuery) {
    return this.projects.list(user, q);
  }

  @Get('export')
  async export(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Query() q: ProjectQuery, @Res() res: Response) {
    const buf = await this.excel.exportXlsx(user, q);
    res.setHeader('Content-Type', XLSX);
    res.setHeader('Content-Disposition', `attachment; filename="projects-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buf);
  }

  @Get('import/template')
  @Roles('ADMIN')
  async template(@TenantId() tenantId: string, @Res() res: Response) {
    const buf = await this.excel.templateXlsx(tenantId);
    res.setHeader('Content-Type', XLSX);
    res.setHeader('Content-Disposition', 'attachment; filename="projects-template.xlsx"');
    res.send(buf);
  }

  @Post('import')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  import(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException({ code: 'NO_FILE' });
    return this.excel.importXlsx(user, file.buffer);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string) {
    return this.projects.get(user, id);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Body() dto: ProjectDto) {
    return this.projects.create(user, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(user, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentUser() user: AuthUser, @TenantId() _t: string, @Param('id') id: string) {
    return this.projects.remove(user, id);
  }
}
