import { Injectable, Logger } from "@nestjs/common";
import * as sgMail from "@sendgrid/mail";
import {
  buildBookingConfirmationHtml,
  BookingConfirmationEmailParams,
} from "../email/templates/booking-confirmation";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      this.logger.warn(
        "SENDGRID_API_KEY is not set. Email sending will be disabled."
      );
    } else {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  private async sendRawMail(opts: {
    to: string;
    subject: string;
    html: string;
  }) {
    if (!process.env.SENDGRID_API_KEY) {
      this.logger.warn(
        `Skipping email to ${opts.to} because SENDGRID_API_KEY is missing.`
      );
      return;
    }

    const from = process.env.MAIL_FROM || "no-reply@stlcourier.com";

    const msg = {
      to: opts.to,
      from,
      subject: opts.subject,
      html: opts.html,
    };

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        attempt++;
        await sgMail.send(msg);
        this.logger.log(
          `Email sent to ${opts.to} (subject="${opts.subject}", attempt=${attempt})`
        );
        return;
      } catch (err: any) {
        this.logger.error(
          `Failed to send email to ${opts.to} on attempt ${attempt}`,
          err?.stack || String(err)
        );
        if (attempt > maxRetries) {
          this.logger.error(
            `Giving up sending email to ${opts.to} after ${attempt} attempts`
          );
          return;
        }
      }
    }
  }

  /**
   * Customer-facing booking + payment confirmation
   */
  async sendBookingPaidCustomerEmail(params: {
    to: string;
    jobId: string;
    pickupDate: string;
    pickupSlot: string;
    deliveryCount: number;
    trackingUrl: string;
  }) {
    const html = buildBookingConfirmationHtml({
      jobId: params.jobId,
      pickupDate: params.pickupDate,
      pickupSlot: params.pickupSlot,
      deliveryCount: params.deliveryCount,
      trackingUrl: params.trackingUrl,
    });

    await this.sendRawMail({
      to: params.to,
      subject: `Booking Confirmed – Job ${params.jobId}`,
      html,
    });
  }

  /**
   * Internal notification for operations / dispatch team
   */
  async sendBookingPaidAdminEmail(params: {
    jobId: string;
    pickupDate: string;
    pickupSlot: string;
    deliveryCount: number;
    trackingUrl: string;
  }) {
    const to = process.env.DISPATCH_EMAIL || "ops@stlcourier.com";

    const html = buildBookingConfirmationHtml({
      jobId: params.jobId,
      pickupDate: params.pickupDate,
      pickupSlot: params.pickupSlot,
      deliveryCount: params.deliveryCount,
      trackingUrl: params.trackingUrl,
      isForAdmin: true,
    });

    await this.sendRawMail({
      to,
      subject: `PAID booking ready – ${params.jobId}`,
      html,
    });
  }
}
