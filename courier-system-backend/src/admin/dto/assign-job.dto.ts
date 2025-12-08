// src/admin/dto/assign-job.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AssignJobDto {
  @IsString()
  @IsNotEmpty()
  driverId: string;

  // Validate mode as one of the two allowed values
  @IsIn(['auto', 'manual'])
  mode: 'auto' | 'manual';
}
