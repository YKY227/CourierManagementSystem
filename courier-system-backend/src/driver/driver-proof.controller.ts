// src/driver/driver-proof.controller.ts
import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { memoryStorage, File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';


type UploadProofDto = {
  stopId?: string;
  driverId?: string;
};

@Controller('driver/jobs')
export class DriverProofController {
  private supabase: SupabaseClient | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase =
      supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey)
        : null;
  }

  @Post(':jobId/proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  async uploadProof(
    @Param('jobId') jobId: string,
    @Body() body: UploadProofDto,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // 1) Ensure job exists
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    const stopId = body.stopId || null;
    const driverId = body.driverId || null;

    // 2) Decide storage backend (hybrid)
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    let publicUrl: string;

    if (isProd && this.supabase) {
      // ─────────────────────────────────────
      // Supabase Storage path
      // ─────────────────────────────────────
      const bucket = 'proof-photos';
      const ext = path.extname(file.originalname) || '';
      const safeName = file.originalname.replace(/\s+/g, '-');
      const filePath = `jobs/${jobId}/${Date.now()}-${safeName}${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        // You might decide to fall back to local storage instead of throwing
        throw new BadRequestException(
          `Failed to upload to Supabase: ${uploadError.message}`,
        );
      }

      const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);
      publicUrl = data.publicUrl;
    } else {
      // ─────────────────────────────────────
      // Local dev storage: /uploads/proof-photos
      // ─────────────────────────────────────
      const uploadsRoot = path.join(process.cwd(), 'uploads', 'proof-photos');
      await fs.mkdir(uploadsRoot, { recursive: true });

      const ext = path.extname(file.originalname) || '';
      const safeName = file.originalname.replace(/\s+/g, '-');
      const filename = `${jobId}-${Date.now()}-${safeName}${ext}`;
      const fullPath = path.join(uploadsRoot, filename);

      await fs.writeFile(fullPath, file.buffer);

      // You’ll want something like this served statically in main.ts:
      // app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
      publicUrl = `/uploads/proof-photos/${filename}`;
    }

    // 3) Create ProofPhoto record
    const proof = await this.prisma.proofPhoto.create({
      data: {
        jobId,
        stopId,
        driverId,
        url: publicUrl,
        metadata: {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedBy: driverId ?? 'unknown',
        },
      },
    });

    // (Optional) You could also update JobStop.status / completedAt here
    // if stopId is provided and you want proof upload = completion

    return {
      success: true,
      proof,
    };
  }
}
