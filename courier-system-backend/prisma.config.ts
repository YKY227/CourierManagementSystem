// prisma.config.ts
import * as dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // We KNOW this must exist, or Prisma will fail earlier
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node ./prisma/seed.ts',
  },
});
