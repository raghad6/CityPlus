import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators';
import { PublicService } from './public.service';

/** Unauthenticated lookups needed by the sign-up page. */
@Controller('public')
@Public()
export class PublicController {
  constructor(private publicData: PublicService) {}

  @Get('tenants')
  tenants() {
    return this.publicData.tenants();
  }

  @Get('tenants/:slug/departments')
  departments(@Param('slug') slug: string) {
    return this.publicData.departments(slug);
  }
}
