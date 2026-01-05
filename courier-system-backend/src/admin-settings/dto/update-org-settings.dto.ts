import { IsArray, IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateOrgSettingsDto {
  @IsOptional() @IsString()
  orgName?: string;

  @IsOptional() @IsEmail()
  supportEmail?: string;

  @IsOptional() @IsString()
  whatsappNumber?: string | null;

  @IsOptional() @IsString()
  brandingLogoUrl?: string | null;

  @IsOptional() @IsArray()
  adminNotificationEmails?: string[];

  @IsOptional() @IsBoolean()
  bccTesterEnabled?: boolean;

  @IsOptional() @IsArray()
  testerEmails?: string[];

  @IsOptional() @IsArray()
  bookingPaidRecipients?: string[];

  @IsOptional() @IsArray()
  overdueRecipients?: string[];
}
