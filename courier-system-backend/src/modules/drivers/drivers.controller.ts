import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Controller('/admin/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  async findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }
}
