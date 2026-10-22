import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Có config file thì Prisma CLI không auto-load .env nữa — load tay.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
});
