import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL manquante");
}

const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

try {
  const result = await prisma.$queryRaw`SELECT 1 AS connected`;

  console.log(result);
  console.log("PRISMA + NEON OK");
} catch (error) {
  console.error("PRISMA ERROR:", error);
} finally {
  await prisma.$disconnect();
}