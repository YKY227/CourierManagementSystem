// src/email/templates/booking-paid-admin.ts

export interface BookingPaidAdminTemplateProps {
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
}

export function bookingPaidAdminHtml(props: BookingPaidAdminTemplateProps): string {
  const {
    jobId,
    pickupDate,
    pickupSlot,
    deliveryCount,
    trackingUrl,
    customerName,
    customerEmail,
    customerPhone,
    pickupRegion,
    serviceType,
    routeType,
    jobType,
  } = props;

  const safe = (value?: string | null) => value ?? "—";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>New PAID booking – ${jobId}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.12);">
            <!-- Header -->
            <tr>
              <td style="background:#0f766e;padding:20px 24px;color:#ecfeff;">
                <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">
                  New PAID Booking
                </div>
                <div style="margin-top:6px;font-size:20px;font-weight:600;">
                  Ready for dispatch
                </div>
                <div style="margin-top:4px;font-size:13px;opacity:0.85;">
                  Job ID: <span style="font-weight:600;">${jobId}</span>
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <p style="margin:0 0 12px 0;font-size:14px;color:#0f172a;">
                  A new <strong>PAID</strong> booking has just been created. Review the details below and assign a driver when ready.
                </p>
              </td>
            </tr>

            <!-- Key info grid -->
            <tr>
              <td style="padding:0 24px 16px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                       style="border-collapse:separate;border-spacing:0 8px;font-size:13px;color:#111827;">
                  <tr>
                    <td style="width:50%;padding:8px 12px;background:#f9fafb;border-radius:8px 0 0 8px;border:1px solid #e5e7eb;border-right:none;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Customer</div>
                      <div style="margin-top:2px;font-weight:600;">${safe(customerName)}</div>
                      <div style="margin-top:2px;color:#4b5563;">${safe(customerEmail)}</div>
                      <div style="margin-top:2px;color:#4b5563;">${safe(customerPhone)}</div>
                    </td>
                    <td style="width:50%;padding:8px 12px;background:#f9fafb;border-radius:0 8px 8px 0;border:1px solid #e5e7eb;border-left:none;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Pickup</div>
                      <div style="margin-top:2px;font-weight:600;">${pickupDate}</div>
                      <div style="margin-top:2px;color:#4b5563;">${pickupSlot}</div>
                      <div style="margin-top:2px;color:#4b5563;">Region: ${safe(pickupRegion)}</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="width:50%;padding:8px 12px;background:#f9fafb;border-radius:8px 0 0 8px;border:1px solid #e5e7eb;border-right:none;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Service</div>
                      <div style="margin-top:2px;font-weight:600;">${safe(serviceType)}</div>
                      <div style="margin-top:2px;color:#4b5563;">Job type: ${safe(jobType)}</div>
                    </td>
                    <td style="width:50%;padding:8px 12px;background:#f9fafb;border-radius:0 8px 8px 0;border:1px solid #e5e7eb;border-left:none;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Route</div>
                      <div style="margin-top:2px;font-weight:600;">${safe(routeType)}</div>
                      <div style="margin-top:2px;color:#4b5563;">Deliveries: <strong>${deliveryCount}</strong></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Call to action -->
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <a href="${trackingUrl}"
                         style="display:inline-block;padding:10px 18px;border-radius:999px;background:#0f766e;color:#ecfeff;text-decoration:none;font-size:13px;font-weight:500;">
                        Open tracking view
                      </a>
                    </td>
                    <td style="padding-left:12px;font-size:12px;color:#6b7280;">
                      Use the admin panel to assign a driver and monitor job progress.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="border-top:1px solid #e5e7eb;padding:12px 24px 16px 24px;font-size:11px;color:#9ca3af;">
                <div>Courier Management System · Internal dispatch notification</div>
                <div style="margin-top:2px;">
                  This email is generated automatically when a customer completes booking and payment.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
