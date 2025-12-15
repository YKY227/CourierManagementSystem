// courier-system-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { healthRouter } from "./routes/health";
import { ValidationPipe } from "@nestjs/common";


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(healthRouter);

  app.useGlobalFilters(new AllExceptionsFilter());
  // ✅ Ensure Prisma onModuleDestroy runs on Ctrl+C / SIGTERM
  app.enableShutdownHooks();

  // Serve local uploads under /uploads for dev
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads')),
  );

  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  })
);


  // 🔥 DEV-ONLY: Very permissive CORS middleware
   app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'false');

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });


  // (Optional) you can still keep Nest's own CORS too, but it's no longer required:
  // app.enableCors({ origin: true });

  const port = process.env.PORT ?? 3001;
  await app.listen(port as number, '0.0.0.0');

  console.log(`Nest app listening on http://localhost:${port}`);
  console.log('DEV CORS middleware is ON (Access-Control-Allow-Origin: *)');
}

bootstrap();
