//src/driver/driver-jobs.controller.ts
import { Body, Controller, Get, Patch, Param, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import { DriverJobsService } from "./driver-jobs.service";
import { UpdateDriverJobStatusDto } from "./dto/update-driver-job-status.dto";
import { MarkStopCompletedDto } from "./dto/mark-stop-completed.dto";
import { DriverJwtGuard } from "./driver-jwt.guard";

type DriverJwtUser = { driverId: string };

@Controller("driver/jobs")
@UseGuards(DriverJwtGuard)
export class DriverJobsController {
  constructor(private readonly driverJobsService: DriverJobsService) {}

  @Get()
  async listMyJobs(@Req() req: Request) {
    const driverId = (req.user as DriverJwtUser | undefined)?.driverId;
    if (!driverId) throw new UnauthorizedException("Invalid token: driverId missing");
    return this.driverJobsService.listJobsForDriver(driverId);
  }

  @Patch(":id/status")
  async updateStatus(@Req() req: Request, @Param("id") jobId: string, @Body() dto: UpdateDriverJobStatusDto) {
    const driverId = (req.user as DriverJwtUser | undefined)?.driverId;
    if (!driverId) throw new UnauthorizedException("Invalid token: driverId missing");
    return this.driverJobsService.updateJobStatus(jobId, dto, driverId);
  }

  @Patch(":id/stops/:stopId")
  async markStopCompleted(
    @Req() req: Request,
    @Param("id") jobId: string,
    @Param("stopId") stopId: string,
    @Body() dto: MarkStopCompletedDto
  ) {
    const driverId = (req.user as DriverJwtUser | undefined)?.driverId;
    if (!driverId) throw new UnauthorizedException("Invalid token: driverId missing");
    return this.driverJobsService.markStopCompleted(jobId, stopId, dto, driverId);
  }
}
