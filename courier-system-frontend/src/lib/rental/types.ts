// src/lib/rental/types.ts
export type EquipmentCategory =
  | "earthmoving"
  | "lifting"
  | "power"
  | "concreting"
  | "compaction"
  | "cleaning";

export type EquipmentPricing = {
  minDays: number;         // e.g. 1 or 3
  dayRate: number;         // per unit per day
  weekRate?: number;       // optional
  monthRate?: number;      // optional
  deposit?: number;        // refundable
};

export type Equipment = {
  id: string;
  title: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;

  images: string[];        // URLs
  shortDesc: string;
  specs: Record<string, string>;  // simple now, structured later

  totalUnits: number;
  isPublished: boolean;

  pricing: EquipmentPricing;
  createdAt: string;
  updatedAt: string;
};

export type RentalQuote = {
  days: number;
  unitPrice: number;
  rentalSubtotal: number;
  deliveryFee: number;
  collectionFee: number;
  deposit: number;
  totalDueNow: number;     // if you later split deposit/payment, this becomes flexible
};
