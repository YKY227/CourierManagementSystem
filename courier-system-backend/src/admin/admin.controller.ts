// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  HttpCode,
  BadRequestException,
} from "@nestjs/common";

import { AdminService } from "./admin.service";
import { AssignJobDto } from "./dto/assign-job.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { AdminJobDetailResponse } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ✅ List jobs (supports pagination)
  // GET /admin/jobs?status=pending&page=1&pageSize=10
  @Get("jobs")
  async getJobs(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const p = Math.max(1, Number(page ?? 1) || 1);
    const ps = Math.min(100, Math.max(1, Number(pageSize ?? 10) || 10));

    return this.adminService.getJobsPaged({ status, page: p, pageSize: ps });
  }

  

  @Get("jobs/:id")
  getJobById(@Param("id") id: string) {
    return this.adminService.getJobById(id);
  }

  @Get("jobs/:id/detail")
  async getJobDetail(@Param("id") id: string): Promise<AdminJobDetailResponse> {
    return this.adminService.getJobDetail(id);
  }

  // ─────────────────────────────────────────────
  // Assign / auto-assign
  // ─────────────────────────────────────────────
  @Patch("jobs/:id/assign")
  assignJob(@Param("id") id: string, @Body() dto: AssignJobDto) {
    return this.adminService.assignJob(id, dto);
  }

  @Post("jobs/:id/auto-assign")
  async autoAssignJob(@Param("id") jobId: string) {
    return this.adminService.autoAssignJob(jobId);
  }

  // ─────────────────────────────────────────────
  // ✅ Delete job (cascade delete handled by DB relations)
  // DELETE /admin/jobs/:id
  // ─────────────────────────────────────────────
  @Delete("jobs/:id")
  @HttpCode(204)
  async deleteJob(@Param("id") id: string) {
    await this.adminService.deleteJob(id);
  }

  // ─────────────────────────────────────────────
  // ✅ Bulk delete by status
  // DELETE /admin/jobs?status=pending
  // ─────────────────────────────────────────────
  @Delete("jobs")
  @HttpCode(204)
  async bulkDeleteJobs(@Query("status") status?: string) {
    await this.adminService.bulkDeleteJobs({ status });
  }

  // ─────────────────────────────────────────────
  // Public tracking by publicId
  // ─────────────────────────────────────────────
  @Get("tracking/:publicId")
  async getPublicTracking(@Param("publicId") publicId: string) {
    return this.adminService.getPublicTrackingByPublicId(publicId);
  }

  // ─────────────────────────────────────────────
  // Create job (public booking)
  // ─────────────────────────────────────────────
  @Post("jobs")
  async createJob(@Body() dto: CreateBookingDto) {
    return this.adminService.createJobFromBooking(dto);
  }

  @Post("jobs/:id/payment-success")
  async markJobPaymentSuccess(@Param("id") jobId: string) {
    const updated = await this.adminService.markPaymentSuccess(jobId);
    return { ok: true, jobId: updated.id, paymentStatus: updated.paymentStatus };
  }

  // ─────────────────────────────────────────────
  // Drivers
  // ─────────────────────────────────────────────
  @Get("drivers")
  async listDrivers() {
    return this.adminService.listDrivers();
  }

  @Get("drivers/:id")
  async getDriver(@Param("id") id: string) {
    return this.adminService.getDriverById(id);
  }

  @Patch("drivers/:id")
  async updateDriver(@Param("id") id: string, @Body() dto: UpdateDriverDto) {
    return this.adminService.updateDriver(id, dto);
  }

  @Patch("drivers/:id/pin")
  async setDriverPin(@Param("id") id: string, @Body() body: { pin: string }) {
    if (!body?.pin) throw new BadRequestException("pin is required");
    return this.adminService.setDriverPin(id, body.pin);
  }

  @Post("drivers/:id/reset-pin")
  async resetDriverPin(@Param("id") id: string, @Body() body: { pin: string }) {
    if (!body?.pin) throw new BadRequestException("pin is required");
    return this.adminService.resetDriverPin(id, body.pin);
  }

  @Post("drivers")
  async createDriver(@Body() dto: CreateDriverDto) {
    return this.adminService.createDriver(dto);
  }

  @Delete("drivers/:id")
@HttpCode(204)
async deleteDriver(@Param("id") id: string) {
  await this.adminService.deleteDriver(id);
}

}
