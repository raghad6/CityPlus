import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsExcelService } from './projects-excel.service';

@Module({ controllers: [ProjectsController], providers: [ProjectsService, ProjectsExcelService], exports: [ProjectsService] })
export class ProjectsModule {}
