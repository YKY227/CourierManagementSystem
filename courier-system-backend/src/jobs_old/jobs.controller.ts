// src/jobs/jobs.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('admin/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }
}
