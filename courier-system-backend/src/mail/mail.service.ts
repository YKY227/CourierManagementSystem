// src/mail/mail.service.ts
import { Injectable, Logger } from "@nestjs/common";
import sgMail, { MailDataRequired } from "@sendgrid/mail";

import { buildBookingConfirmationHtml } from "../email/templates/booking-confirmation";
import { bookingPaidAdminHtml } from "../email/templates/booking-paid-admin";
import { PrismaService } from "../prisma/prisma.service";

function splitCsvEmails(input?: string): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly dispatchEmail?: string;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      this.logger.warn("SENDGRID_API_KEY is not set – email sending is DISABLED.");
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
    const { to, jobId, pickupDate, pickupSlot, deliveryCount, trackingUrl } = args;

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

  private async getOrgSettingsSingleton() {
    // Safe singleton loader: avoids Prisma upsert race on unique id
    let settings = await this.prisma.orgSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      try {
        settings = await this.prisma.orgSettings.create({
          data: {
            id: "singleton",
            // keep minimal defaults here (admin can edit later)
            orgName: "Courier Ops",
            supportEmail: "support@example.com",
            adminNotificationEmails: [],
            bookingPaidRecipients: [],
            overdueRecipients: [],
            bccTesterEnabled: false,
            testerEmails: [],
          },
        });
      } catch (e) {
        // If another request created it first, fetch again
        settings = await this.prisma.orgSettings.findUnique({
          where: { id: "singleton" },
        });
      }
    }

    if (!settings) {
      throw new Error("OrgSettings singleton could not be loaded/created");
    }

    return settings;
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
    // 1) Load OrgSettings singleton (source of truth)
    const settings = await this.getOrgSettingsSingleton();

    // 2) Choose PRIMARY recipients in priority order:
    //   A) bookingPaidRecipients (event-specific)
    //   B) adminNotificationEmails (general fallback)
    //   C) DISPATCH_EMAIL env fallback (legacy support)
    const primaryRecipients =
      (settings.bookingPaidRecipients?.length ? settings.bookingPaidRecipients : null) ??
      (settings.adminNotificationEmails?.length ? settings.adminNotificationEmails : null) ??
      (this.dispatchEmail ? [this.dispatchEmail] : []);

    if (!primaryRecipients.length) {
      this.logger.warn(
        "No admin recipients found (OrgSettings + DISPATCH_EMAIL empty) – skipping admin notification email.",
      );
      return;
    }

    // 3) Optional tester BCC (checkbox-driven) + optional env override for quick testing
    // Env override (optional):
    //   ADMIN_TEST_BCC_EMAILS="tester1@x.com,tester2@x.com"
    const envTestBcc = splitCsvEmails(process.env.ADMIN_TEST_BCC_EMAILS);

    const bccRecipients = uniq([
      ...(settings.bccTesterEnabled ? (settings.testerEmails ?? []) : []),
      ...envTestBcc,
    ]);

    const html = bookingPaidAdminHtml({
      ...args,
    });

    const msg: MailDataRequired = {
      to: primaryRecipients,
      ...(bccRecipients.length ? { bcc: bccRecipients } : {}),
      from: this.fromEmail,
      subject: `PAID booking ${args.jobId} – ready for dispatch`,
      html,
    };

    await this.sendMail(msg, `booking-paid admin (${args.jobId})`);
  }

  private async sendMail(msg: MailDataRequired, label: string): Promise<void> {
    try {
      const toStr = Array.isArray(msg.to) ? msg.to.join(", ") : String(msg.to);
      const bccAny = (msg as any).bcc;
      const bccStr = bccAny
        ? Array.isArray(bccAny)
          ? bccAny.join(", ")
          : String(bccAny)
        : "";

      this.logger.log(
        `Sending ${label} email → to=${toStr}${bccStr ? ` | bcc=${bccStr}` : ""}`,
      );

      const [res] = await sgMail.send(msg);
      this.logger.log(
        `${label} email sent. statusCode=${res.statusCode ?? "unknown"}`,
      );
    } catch (err: any) {
      this.logger.error(`Failed to send ${label} email`, err?.message ?? err);
      if (err?.response?.body) {
        this.logger.error(
          `${label} SendGrid response body: ${JSON.stringify(err.response.body)}`,
        );
      }
      // swallow so payment-success endpoint still succeeds
    }
  }
}
