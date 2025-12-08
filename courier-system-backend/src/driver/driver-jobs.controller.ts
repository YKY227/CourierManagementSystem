// src/driver/driver-jobs.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { DriverJobsService } from './driver-jobs.service';
import { UpdateDriverJobStatusDto } from './dto/update-driver-job-status.dto';
import { MarkStopCompletedDto } from './dto/mark-stop-completed.dto';

@Controller('driver/jobs')
export class DriverJobsController {
  constructor(private readonly driverJobsService: DriverJobsService) {}

  // GET /driver/jobs?driverId=drv-1
  @Get()
  async listJobs(@Query('driverId') driverId: string) {
    return this.driverJobsService.listJobsForDriver(driverId);
  }

  // PATCH /driver/jobs/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') jobId: string,
    @Body() dto: UpdateDriverJobStatusDto,
  ) {
    return this.driverJobsService.updateJobStatus(jobId, dto);
  }

  // PATCH /driver/jobs/:id/stops/:stopId
  @Patch(':id/stops/:stopId')
  async markStopCompleted(
    @Param('id') jobId: string,
    @Param('stopId') stopId: string,
    @Body() dto: MarkStopCompletedDto,
  ) {
    return this.driverJobsService.markStopCompleted(jobId, stopId, dto);
  }
}
