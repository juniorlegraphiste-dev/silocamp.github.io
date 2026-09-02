import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquante. Configure-la dans Vercel.",
  );
}

const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});

export const prisma = new PrismaClient({
  adapter,
});