export type BookingConfirmationEmailParams = {
  jobId: string;
  pickupDate: string;
  pickupSlot: string;
  deliveryCount: number;
  trackingUrl: string;
  isForAdmin?: boolean; // render slightly different copy for ops team
};

export function buildBookingConfirmationHtml(
  params: BookingConfirmationEmailParams
): string {
  const {
    jobId,
    pickupDate,
    pickupSlot,
    deliveryCount,
    trackingUrl,
    isForAdmin,
  } = params;

  const headline = isForAdmin
    ? "New Paid Booking Received"
    : "Your Booking Is Confirmed";

  const introText = isForAdmin
    ? "A new courier job has been paid and is ready for assignment."
    : "Thank you for choosing STL Courier. Your booking and payment have been confirmed.";

  const actionLabel = isForAdmin ? "Open Tracking View" : "Track Your Delivery";

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f4f4f5; padding: 24px; margin:0;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(15,23,42,0.08);">

            <!-- Logo / Brand -->
            <tr>
              <td style="text-align:left; padding-bottom:8px;">
                <span style="display:inline-block; font-weight:700; font-size:18px; color:#020617;">
                  STL Courier
                </span>
              </td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="text-align:left; padding-top:4px;">
                <h2 style="color:#020617; margin:0 0 4px 0; font-size:20px;">${headline}</h2>
                <p style="color:#4b5563; font-size:14px; margin:0;">${introText}</p>
              </td>
            </tr>

            <!-- Spacer -->
            <tr><td style="height:16px;"></td></tr>

            <!-- Details card -->
            <tr>
              <td style="padding:16px; border-radius:10px; background:linear-gradient(135deg,#eff6ff,#f9fafb); border:1px solid #e5e7eb;">
                <p style="margin:0 0 6px 0; font-size:14px;">
                  <strong style="color:#0f172a;">Job ID:</strong>
                  <span style="color:#0f172a;">${jobId}</span>
                </p>

                <p style="margin:0 0 6px 0; font-size:14px;">
                  <strong style="color:#0f172a;">Pickup Date:</strong>
                  <span>${pickupDate}</span>
                </p>

                <p style="margin:0 0 6px 0; font-size:14px;">
                  <strong style="color:#0f172a;">Pickup Slot:</strong>
                  <span>${pickupSlot}</span>
                </p>

                <p style="margin:0 0 6px 0; font-size:14px;">
                  <strong style="color:#0f172a;">Delivery Points:</strong>
                  <span>${deliveryCount} location${deliveryCount === 1 ? "" : "s"}</span>
                </p>

                <p style="margin:0; font-size:14px;">
                  <strong style="color:#0f172a;">Payment Status:</strong>
                  <span style="color:#059669;">Paid</span>
                </p>
              </td>
            </tr>

            <!-- Spacer -->
            <tr><td style="height:20px;"></td></tr>

            <!-- Tracking Button -->
            <tr>
              <td align="center">
                <a href="${trackingUrl}"
                  style="
                    background:#0ea5e9;
                    color:#ffffff;
                    padding:12px 22px;
                    font-size:14px;
                    border-radius:999px;
                    text-decoration:none;
                    display:inline-block;
                    font-weight:600;
                  "
                >
                  ${actionLabel}
                </a>
              </td>
            </tr>

            <!-- Spacer -->
            <tr><td style="height:24px;"></td></tr>

            <!-- Footer -->
            <tr>
              <td style="text-align:left; font-size:12px; color:#9ca3af;">
                <p style="margin:0 0 4px 0;">
                  If you did not make this booking, please contact our support team immediately.
                </p>
                <p style="margin:0; color:#cbd5f5;">
                  © ${new Date().getFullYear()} STL Courier. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
