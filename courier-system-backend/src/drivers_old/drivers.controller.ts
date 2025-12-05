// src/drivers/drivers.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { DriversService } from './drivers.service';

@Controller('admin/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  getAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }
}
