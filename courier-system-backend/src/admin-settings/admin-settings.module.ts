import { Module } from "@nestjs/common";
import { AdminSettingsController } from "./admin-settings.controller";
import { AdminSettingsService } from "./admin-settings.service";
import { PrismaService } from "../prisma/prisma.service";
import { MailModule } from "../mail/mail.module"; // adjust if different
import { AdminGuard } from "../auth/admin.guard";
@Module({
     imports: [MailModule],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService, PrismaService, AdminGuard],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
