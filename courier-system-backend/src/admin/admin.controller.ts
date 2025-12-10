// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query, 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AdminJobDetailResponse } from './admin.service';
import { CreateBookingDto } from './dto/create-booking.dto';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────────────────────────────────────
  // Existing endpoints
  // ─────────────────────────────────────────────
  // ✅ List jobs with optional status filter
  @Get('jobs')
  async getJobs(@Query('status') status?: string) {
    return this.adminService.getJobs({ status });
  }

  // ✅ IMPORTANT: define this BEFORE jobs/:id so "completed" doesn't match :id
  @Get('jobs/completed')
  async getCompletedJobs() {
    return this.adminService.getJobs({ status: 'completed' });
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

  // Public tracking by publicId (what the customer types in)
  @Get('tracking/:publicId')
  async getPublicTracking(
    @Param('publicId') publicId: string,
  ) {
    return this.adminService.getPublicTrackingByPublicId(publicId);
  }

  // ─────────────────────────────────────────────
  // NEW: public booking -> create job
  // ─────────────────────────────────────────────
  @Post('jobs')
  async createJob(@Body() dto: CreateBookingDto) {
    return this.adminService.createJobFromBooking(dto);
  }

  @Post("jobs/:id/payment-success")
  async markJobPaymentSuccess(@Param("id") jobId: string) {
    const updated = await this.adminService.markPaymentSuccess(jobId);
    return { ok: true, jobId: updated.id, paymentStatus: updated.paymentStatus };
  }

}
