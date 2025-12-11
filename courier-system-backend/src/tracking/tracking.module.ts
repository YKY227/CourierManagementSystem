// src/tracking/tracking.module.ts
import { Module } from "@nestjs/common";
import { TrackingController } from "./tracking.controller";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  controllers: [TrackingController],
})
export class TrackingModule {}
