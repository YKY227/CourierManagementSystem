// src/driver/driver-jwt.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

type DriverJwtPayload = {
  sub?: string;
  role?: string;      // must be "driver"
  driverId?: string;  // required
};

@Injectable()
export class DriverJwtStrategy extends PassportStrategy(Strategy, "driver-jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.DRIVER_JWT_SECRET || "dev-driver-secret",
      ignoreExpiration: false,
    });
  }

  async validate(payload: DriverJwtPayload) {
    // 1) Enforce role (strict)
    if (payload.role !== "driver") {
      throw new UnauthorizedException("Invalid token role");
    }

    // 2) Require driverId
    if (!payload.driverId) {
      throw new UnauthorizedException("Invalid token: driverId missing");
    }

    // 3) Load driver profile (so /driver/me works and PWA can show name)
    const driver = await this.prisma.driver.findUnique({
      where: { id: payload.driverId },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        phone: true,
        primaryRegion: true,
        vehicleType: true,
        isActive: true,
      },
    });

    if (!driver) {
      throw new UnauthorizedException("Driver not found");
    }
    if (!driver.isActive) {
      throw new UnauthorizedException("Driver is inactive");
    }

    // 4) req.user shape
    return {
      id: driver.id,               // ✅ frontend expects id
      driverId: driver.id,         // ✅ keep for convenience
      authUserId: payload.sub ?? null,
      role: "driver",
      code: driver.code ?? null,
      name: driver.name,
      email: driver.email ?? null,
      phone: driver.phone ?? null,
      primaryRegion: driver.primaryRegion,
      vehicleType: driver.vehicleType,
    };
  }
}
