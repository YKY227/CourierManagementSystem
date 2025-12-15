//src/driver/driver-auth.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import { DriverAuthService } from "./driver-auth.service";
import { DriverLoginDto } from "./dto/driver-login.dto";


@Controller("driver/auth")
export class DriverAuthController {
  constructor(private readonly auth: DriverAuthService) {}

  // POST /driver/auth/login
  @Post("login")
  async login(@Body() dto: DriverLoginDto) {
    return this.auth.login(dto);
  }
}
