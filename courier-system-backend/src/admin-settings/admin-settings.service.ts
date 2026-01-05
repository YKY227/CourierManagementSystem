import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type OrgSettingsDto = {
  orgName: string;
  supportEmail: string;
  whatsappNumber?: string | null;
  brandingLogoUrl?: string | null;

  adminNotificationEmails: string[];
  bccTesterEnabled: boolean;
  testerEmails: string[];

  bookingPaidRecipients: string[];
  overdueRecipients: string[];

  updatedAt: string;
};

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read singleton settings. If missing, create once.
   * Safe against race conditions (two concurrent requests creating).
   */
  async getSettings(): Promise<OrgSettingsDto> {
    let row = await this.prisma.orgSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!row) {
      try {
        row = await this.prisma.orgSettings.create({
          data: {
            id: "singleton",
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
        row = await this.prisma.orgSettings.findUnique({
          where: { id: "singleton" },
        });
      }
    }

    // At this point, row should exist; if not, something is seriously wrong
    if (!row) {
      throw new Error("OrgSettings singleton could not be loaded/created");
    }

    return {
      orgName: row.orgName,
      supportEmail: row.supportEmail,
      whatsappNumber: row.whatsappNumber,
      brandingLogoUrl: row.brandingLogoUrl,

      adminNotificationEmails: row.adminNotificationEmails ?? [],
      bccTesterEnabled: row.bccTesterEnabled ?? false,
      testerEmails: row.testerEmails ?? [],

      bookingPaidRecipients: row.bookingPaidRecipients ?? [],
      overdueRecipients: row.overdueRecipients ?? [],

      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Update settings. Only updates provided keys (no accidental undefined overwrites).
   */
  async updateSettings(patch: Partial<Omit<OrgSettingsDto, "updatedAt">>) {
    // Build update payload without undefined values
    const data: any = {};
    if (patch.orgName !== undefined) data.orgName = patch.orgName;
    if (patch.supportEmail !== undefined) data.supportEmail = patch.supportEmail;
    if (patch.whatsappNumber !== undefined) data.whatsappNumber = patch.whatsappNumber;
    if (patch.brandingLogoUrl !== undefined) data.brandingLogoUrl = patch.brandingLogoUrl;

    if (patch.adminNotificationEmails !== undefined) data.adminNotificationEmails = patch.adminNotificationEmails;
    if (patch.bccTesterEnabled !== undefined) data.bccTesterEnabled = patch.bccTesterEnabled;
    if (patch.testerEmails !== undefined) data.testerEmails = patch.testerEmails;

    if (patch.bookingPaidRecipients !== undefined) data.bookingPaidRecipients = patch.bookingPaidRecipients;
    if (patch.overdueRecipients !== undefined) data.overdueRecipients = patch.overdueRecipients;

    const row = await this.prisma.orgSettings.update({
      where: { id: "singleton" },
      data,
    });

    return {
      ...(await this.getSettings()),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
