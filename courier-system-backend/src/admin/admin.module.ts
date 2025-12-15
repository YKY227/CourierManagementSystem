// courier-system-backend/src/admin/admin.module.ts
import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { PrismaService } from "../prisma/prisma.service";

import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [MailModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
