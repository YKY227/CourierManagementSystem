"use client";

import type { ReactNode } from "react";
import { BookingProvider } from "@/lib/booking-store";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <BookingProvider>{children}</BookingProvider>;
}
