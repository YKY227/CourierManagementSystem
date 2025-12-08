// src/driver/dto/mark-stop-completed.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class MarkStopCompletedDto {
  // optional placeholder – you can expand later (e.g. proofPhotoUrl, note, timestamp override)
  @IsOptional()
  @IsString()
  note?: string;
}
