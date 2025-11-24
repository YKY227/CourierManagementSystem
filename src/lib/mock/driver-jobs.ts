// src/lib/mock/driver-jobs.ts

export type DriverJobStatus =
  | "booked"
  | "allocated"
  | "pickup"
  | "in-progress"
  | "completed";

export type DriverStopType = "pickup" | "delivery" | "return";

export interface DriverJobStop {
  id: string;
  type: DriverStopType;
  sequence: number;
  label: string;
  addressLine1: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  remarks?: string;
  completed?: boolean; // for offline/local completion
}

export interface DriverJob {
  id: string;
  displayId: string;
  serviceType: "same-day" | "next-day" | "express-3h";
  status: DriverJobStatus;

  pickupWindow: string;
  pickupDate: string;

  totalStops: number;
  totalBillableWeightKg: number;

  originLabel: string;
  areaLabel: string;

  stops: DriverJobStop[];
}

export const mockDriverJobs: DriverJob[] = [
  {
    id: "job-1",
    displayId: "STL-251123-1023",
    serviceType: "same-day",
    status: "pickup",
    pickupWindow: "09:00 – 12:00",
    pickupDate: "2025-11-25",
    totalStops: 3,
    totalBillableWeightKg: 18.4,
    originLabel: "Tech Hygiene Hub",
    areaLabel: "Central / CBD",
    stops: [
      {
        id: "s1",
        type: "pickup",
        sequence: 1,
        label: "Pickup – Tech Hygiene Hub",
        addressLine1: "10 Dover Drive",
        postalCode: "138683",
        contactName: "Yong",
        contactPhone: "+65 9000 0001",
        remarks: "Laptop cleaning equipment – handle carefully.",
      },
      {
        id: "s2",
        type: "delivery",
        sequence: 2,
        label: "Delivery – ITE College Central",
        addressLine1: "2 Ang Mo Kio Drive",
        postalCode: "567720",
        contactName: "Operations Counter",
        contactPhone: "+65 9000 0002",
        remarks: "Deliver before 4pm; report to security.",
      },
      {
        id: "s3",
        type: "delivery",
        sequence: 3,
        label: "Delivery – Client Office",
        addressLine1: "1 Fusionopolis Way",
        postalCode: "138632",
        contactName: "IT Dept",
        contactPhone: "+65 9000 0003",
        remarks: "Restricted access – call on arrival.",
      },
    ],
  },
  {
    id: "job-2",
    displayId: "STL-261123-2045",
    serviceType: "express-3h",
    status: "allocated",
    pickupWindow: "14:00 – 17:00",
    pickupDate: "2025-11-25",
    totalStops: 2,
    totalBillableWeightKg: 5.2,
    originLabel: "Cleanroom Logistics",
    areaLabel: "West / Jurong",
    stops: [
      {
        id: "s1",
        type: "pickup",
        sequence: 1,
        label: "Pickup – Cleanroom Logistics",
        addressLine1: "50 Jurong Gateway Road",
        postalCode: "608549",
        contactName: "Supervisor",
        contactPhone: "+65 9000 1000",
      },
      {
        id: "s2",
        type: "delivery",
        sequence: 2,
        label: "Delivery – Lab Partner",
        addressLine1: "5 Science Park Drive",
        postalCode: "118260",
        contactName: "Lab Admin",
        contactPhone: "+65 9000 2000",
      },
    ],
  },
];
