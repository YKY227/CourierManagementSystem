import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { toDriverResponse } from '../../common/transformers/driver.transformer';
import { RegionCode, VehicleType, DriverStatus } from '../../../generated/prisma/client';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const drivers = await this.prisma.driver.findMany({
      orderBy: { name: 'asc' },
    });
    return drivers.map(toDriverResponse);
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return toDriverResponse(driver);
  }

  async update(id: string, dto: UpdateDriverDto) {
    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        vehicleType: dto.vehicleType as VehicleType | undefined,
        vehiclePlate: dto.vehiclePlate,
        primaryRegion: dto.primaryRegion as RegionCode | undefined,
        secondaryRegions: dto.secondaryRegions as any, // cast for now
        maxJobsPerDay: dto.maxJobsPerDay,
        maxJobsPerSlot: dto.maxJobsPerSlot,
        workDayStartHour: dto.workDayStartHour,
        workDayEndHour: dto.workDayEndHour,
        isActive: dto.isActive,
        currentStatus: dto.currentStatus as DriverStatus | undefined,
        locationLat: dto.location?.lat ?? null,
        locationLng: dto.location?.lng ?? null,
        notes: dto.notes,
      },
    });

    return toDriverResponse(updated);
  }
}
