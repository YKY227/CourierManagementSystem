// src/admin/admin.module.ts
import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma/prisma.service";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [MailModule],        // we need email sending for payment-success
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],      // so TrackingModule can use AdminService
})
export class AdminModule {}
