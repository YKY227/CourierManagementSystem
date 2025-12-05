import { Controller, Get, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('/admin/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }
}
