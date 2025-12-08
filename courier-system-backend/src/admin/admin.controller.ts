// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AdminJobDetailResponse } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────────────────────────────────────
  // Existing endpoints
  // ─────────────────────────────────────────────
  @Get('jobs')
  getJobs() {
    return this.adminService.getJobs();
  }

  @Get('jobs/:id')
  getJobById(@Param('id') id: string) {
    return this.adminService.getJobById(id);
  }

  // ─────────────────────────────────────────────
  // NEW: Assign job to driver(manual)
  // PATCH /admin/jobs/:id/assign
  // ─────────────────────────────────────────────
  @Patch('jobs/:id/assign')
  assignJob(
    @Param('id') id: string,
    @Body() dto: AssignJobDto,
  ) {
    return this.adminService.assignJob(id, dto);
  }

  @Post('jobs/:id/auto-assign')
  async autoAssignJob(@Param('id') jobId: string) {
    return this.adminService.autoAssignJob(jobId);
  }

   // ───────── Drivers endpoints ─────────

  @Get('drivers')
  async listDrivers() {
    return this.adminService.listDrivers();
  }

  @Get('drivers/:id')
  async getDriver(@Param('id') id: string) {
    return this.adminService.getDriverById(id);
  }

  @Patch('drivers/:id')
  async updateDriver(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.adminService.updateDriver(id, dto);
  }

  @Get('jobs/:id/detail')
async getJobDetail(
  @Param('id') id: string,
): Promise<AdminJobDetailResponse> {
  return this.adminService.getJobDetail(id);
}

}
