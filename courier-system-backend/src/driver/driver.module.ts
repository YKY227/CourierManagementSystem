// src/driver/driver.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from '../prisma/prisma.service';
import { DriverJobsService } from "./driver-jobs.service";
import { DriverJobsController } from "./driver-jobs.controller";
import { PassportModule } from "@nestjs/passport";
import { DriverProofController } from "./driver-proof.controller";

import { DriverAuthController } from "./driver-auth.controller";
import { DriverAuthService } from "./driver-auth.service";
import { DriverJwtStrategy } from "./driver-jwt.strategy";
import { DriverController } from "./driver.controller";

@Module({
  imports: [ PassportModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.DRIVER_JWT_SECRET || "dev-driver-secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [DriverJobsController, DriverProofController, DriverAuthController,DriverController],
  providers: [PrismaService, DriverJobsService, DriverAuthService, DriverJwtStrategy],
})
export class DriverModule {}
