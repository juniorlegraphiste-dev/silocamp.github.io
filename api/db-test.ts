import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

export default async function handler(_req: any, res: any) {
  let prisma: PrismaClient | undefined;

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        prisma: false,
        error: "DATABASE_URL manquante",
      });
    }

    const adapter = new PrismaNeon({
      connectionString: databaseUrl,
    });

    prisma = new PrismaClient({
      adapter,
    });

    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      ok: true,
      prisma: true,
      database: true,
      message: "Prisma + Neon PostgreSQL fonctionnent correctement",
    });
  } catch (error: any) {
    console.error("PRISMA TEST ERROR:", error);

    return res.status(500).json({
      ok: false,
      prisma: false,
      database: false,
      error: error?.message || "Erreur Prisma inconnue",
    });
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error("PRISMA DISCONNECT ERROR:", disconnectError);
      }
    }
  }
}