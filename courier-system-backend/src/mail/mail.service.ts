// src/mail/mail.service.ts
import { Injectable, Logger } from "@nestjs/common";
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { buildBookingConfirmationHtml} from "../email/templates/booking-confirmation";
import { bookingPaidAdminHtml } from "../email/templates/booking-paid-admin";


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly dispatchEmail?: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        "SENDGRID_API_KEY is not set – email sending is DISABLED.",
      );
    } else {
      this.logger.log("Configuring SendGrid API key...");
      sgMail.setApiKey(apiKey);
    }

    this.fromEmail = process.env.MAIL_FROM ?? "no-reply@example.com";
    this.dispatchEmail = process.env.DISPATCH_EMAIL;

    this.logger.log(
      `MailService initialised. from=${this.fromEmail}, dispatch=${this.dispatchEmail ?? "none"}`,
    );
  }

  async sendBookingPaidCustomerEmail(args: {
    to: string;
    jobId: string;
    pickupDate: string;
    pickupSlot: string;
    deliveryCount: number;
    trackingUrl: string;
  }): Promise<void> {
    const { to, jobId, pickupDate, pickupSlot, deliveryCount, trackingUrl } =
      args;

    const html = buildBookingConfirmationHtml({
      jobId,
      pickupDate,
      pickupSlot,
      deliveryCount,
      trackingUrl,
    });

    const msg: MailDataRequired = {
      to,
      from: this.fromEmail,
      subject: `Your booking ${jobId} is confirmed & paid`,
      html,
    };

    await this.sendMail(msg, `booking-paid customer (${jobId})`);
  }

  async sendBookingPaidAdminEmail(args: {
    jobId: string;
    pickupDate: string;
    pickupSlot: string;
    deliveryCount: number;
    trackingUrl: string;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    pickupRegion?: string | null;
    serviceType?: string | null;
    routeType?: string | null;
    jobType?: string | null;
  }): Promise<void> {
    if (!this.dispatchEmail) {
      this.logger.warn(
        "DISPATCH_EMAIL not set – skipping admin notification email.",
      );
      return;
    }

    const html = bookingPaidAdminHtml({
      ...args,
      // ensure there is always a trackingUrl and jobId etc.
    });

    const msg: MailDataRequired = {
      to: this.dispatchEmail,
      from: this.fromEmail,
      subject: `PAID booking ${args.jobId} – ready for dispatch`,
      html,
    };

    await this.sendMail(msg, `booking-paid admin (${args.jobId})`);
  }


  private async sendMail(msg: MailDataRequired, label: string): Promise<void> {
    try {
      this.logger.log(
        `Sending ${label} email → to=${Array.isArray(msg.to) ? msg.to.join(",") : msg.to
        }`,
      );
      const [res] = await sgMail.send(msg);
      this.logger.log(
        `${label} email sent. statusCode=${res.statusCode ?? "unknown"}`,
      );
    } catch (err: any) {
      this.logger.error(`Failed to send ${label} email`, err?.message ?? err);
      if (err?.response?.body) {
        this.logger.error(
          `${label} SendGrid response body: ${JSON.stringify(
            err.response.body,
          )}`,
        );
      }
      // rethrow if you want payment endpoint to fail, or swallow if not
      // for now, swallow so payment-success endpoint still returns 201
    }
  }
}
