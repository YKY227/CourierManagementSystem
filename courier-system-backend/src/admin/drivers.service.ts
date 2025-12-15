// courier-system-backend/src/admin/drivers.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminDriversService {
  constructor(private readonly prisma: PrismaService) {}

  async listDrivers() {
    const rows = await this.prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,                // ✅ FIX: include code
        name: true,
        email: true,
        phone: true,
        vehicleType: true,
        vehiclePlate: true,
        primaryRegion: true,
        secondaryRegions: true,
        isActive: true,
        maxJobsPerDay: true,
        maxJobsPerSlot: true,
        workDayStartHour: true,
        workDayEndHour: true,
        notes: true,
        authUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ quick debug (remove later)
    console.log("[AdminDriversService.listDrivers] first row:", rows?.[0]);

    return rows;
  }
}
