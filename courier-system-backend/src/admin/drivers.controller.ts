// courier-system-backend/src/admin/drivers.controller.ts
import { Controller, Get } from "@nestjs/common";
import { AdminDriversService } from "./drivers.service";

@Controller("admin/drivers")
export class AdminDriversController {
  constructor(private readonly drivers: AdminDriversService) {}

  @Get()
  async list() {
    return this.drivers.listDrivers();
  }
}
