// courier-system-backend/src/driver/driver-auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { DriverLoginDto } from "./dto/driver-login.dto";

@Injectable()
export class DriverAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: DriverLoginDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { code: dto.code },
    });

    if (!driver || !driver.pinHash) {
      throw new UnauthorizedException("Invalid code or PIN");
    }

    if (!driver.isActive) {
      throw new ForbiddenException("Driver is inactive");
    }

    const ok = await bcrypt.compare(dto.pin, driver.pinHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid code or PIN");
    }

    const payload = {
      sub: driver.id,
      driverId: driver.id,
      role: "driver",
    };

    const token = await this.jwt.signAsync(payload);

    return {
      token,
      driver: {
        id: driver.id,
        code: driver.code,
        name: driver.name,
      },
    };
  }
}
