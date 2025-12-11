import { Controller, Get, Param, Post, Logger  } from "@nestjs/common";
import { AdminService } from "../admin/admin.service";

@Controller()
export class TrackingController {
    private readonly logger = new Logger(TrackingController.name);
  constructor(private readonly adminService: AdminService) {}

  // TODO: your real tracking endpoint (to implement later)
  @Get("tracking/:publicId")
  async getTracking(@Param("publicId") publicId: string) {
    this.logger.log(`GET /tracking/${publicId} hit`);
    // Placeholder – you'll implement this later
    return { ok: true, publicId };
  }

  // ✅ Public payment-success endpoint, using publicId
    @Post("tracking/:publicId/payment-success")
  async markPaymentSuccessPublic(@Param("publicId") publicId: string) {
    this.logger.log(
      `POST /tracking/${publicId}/payment-success hit (before service)`
    );

    const updated = await this.adminService.markPaymentSuccess(publicId);

    this.logger.log(
      `Payment success handled for job ${updated.publicId ?? updated.id}`
    );

    return {
      ok: true,
      jobId: updated.publicId ?? updated.id,
      paymentStatus: updated.paymentStatus,
    };
  }
}
