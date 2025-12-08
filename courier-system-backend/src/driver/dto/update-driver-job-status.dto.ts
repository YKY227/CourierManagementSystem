// src/driver/dto/update-driver-job-status.dto.ts
import { IsString, IsIn } from 'class-validator';

// Mirror your DriverJobStatus type in frontend
export type DriverJobStatusDtoType =
  | 'booked'
  | 'allocated'
  | 'pickup'
  | 'in-progress'
  | 'completed';

export class UpdateDriverJobStatusDto {
  @IsString()
  @IsIn(['booked', 'allocated', 'pickup', 'in-progress', 'completed'])
  status!: DriverJobStatusDtoType;
}
