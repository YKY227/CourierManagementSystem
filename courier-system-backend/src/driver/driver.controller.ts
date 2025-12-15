// src/driver/driver.controller.ts
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { DriverJwtGuard } from "./driver-jwt.guard";

@Controller("driver")
export class DriverController {
  @UseGuards(DriverJwtGuard)
  @Get("me")
  me(@Req() req: any) {
    return req.user; // populated by DriverJwtStrategy.validate()
  }
}
