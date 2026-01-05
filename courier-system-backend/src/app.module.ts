// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';
import { AdminModule } from "./admin/admin.module";
import { DriverModule } from './driver/driver.module';
import { DriverProofController } from './driver/driver-proof.controller';
import {MailModule} from './mail/mail.module';
import { TrackingModule } from "./tracking/tracking.module";
import { PricingModule } from "./pricing/pricing.module";
import { AdminSettingsModule } from "./admin-settings/admin-settings.module";

@Module({
  imports: [
    // 🔥 MUST COME FIRST — loads .env for whole app
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    DriversModule,
    JobsModule,
    DriverModule,
    MailModule,
    TrackingModule,
    AdminModule,
    PricingModule, 
    AdminSettingsModule,
  ],
  controllers: [
    AppController,
    AdminController,
    DriverProofController,
  ],
  providers: [
    AdminService,
    AppService,
  ],
})
export class AppModule {}
