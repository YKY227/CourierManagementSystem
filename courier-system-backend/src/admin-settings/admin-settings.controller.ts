import { Body, Controller, Get, Put } from "@nestjs/common";
import { AdminSettingsService } from "./admin-settings.service";
import { UpdateOrgSettingsDto } from "./dto/update-org-settings.dto";
import { Post } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { AdminGuard } from "../auth/admin.guard"; // we’ll add this below

// TODO: protect with your Admin JWT guard
import { UseGuards } from "@nestjs/common";
// import { AdminJwtGuard } from "../auth/admin-jwt.guard";

@Controller("admin/settings")
@UseGuards(AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly settings: AdminSettingsService,
    private readonly mail: MailService,
  ) {}


  // @UseGuards(AdminJwtGuard)
  @Get()
  get() {
    return this.settings.getSettings();
  }

  // @UseGuards(AdminJwtGuard)
  @Put()
  update(@Body() dto: UpdateOrgSettingsDto) {
    return this.settings.updateSettings(dto);
  }

   @Post("test-email")
  async sendTestEmail() {
    // Use booking-paid admin template or a simple template
    await this.mail.sendBookingPaidAdminEmail({
      jobId: "TEST-0001",
      pickupDate: "2026-01-05",
      pickupSlot: "12:00 – 15:00",
      deliveryCount: 1,
      trackingUrl: "https://example.com/tracking/TEST-0001",
      customerName: "Test Customer",
      customerEmail: "test.customer@example.com",
      customerPhone: "+65 9000 0000",
      pickupRegion: "central",
      serviceType: "same-day",
      routeType: "one-to-one",
      jobType: "scheduled",
    });

    return { ok: true };
  }
}
