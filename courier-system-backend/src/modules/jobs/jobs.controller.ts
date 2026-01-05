// courier-system-backend/src/modules/jobs/jobs.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateBookingDto } from "../../admin/dto/create-booking.dto";


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

  // ✅ Create job from booking wizard payload
  @Post()
  async createFromBooking(@Body() dto: CreateBookingDto) {
    return this.jobsService.createFromBooking(dto);

  }
}
