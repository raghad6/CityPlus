import { Global, Module } from '@nestjs/common';
import { SummariesModule } from '../summaries/summaries.module';
import { ProjectEventsService } from './project-events.service';

/** Global so projects, reports and import can call `scanSoon()` after a change. */
@Global()
@Module({
  imports: [SummariesModule],
  providers: [ProjectEventsService],
  exports: [ProjectEventsService],
})
export class ProjectEventsModule {}
