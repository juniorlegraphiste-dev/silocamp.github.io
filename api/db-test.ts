import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

export default async function handler(_req: any, res: any) {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        database: false,
        error: "DATABASE_URL est absente de Vercel",
      });
    }

    const adapter = new PrismaNeon({
      connectionString: databaseUrl,
    });

    const prisma = new PrismaClient({
      adapter,
    });

    await prisma.$queryRaw`SELECT 1`;

    await prisma.$disconnect();

    return res.status(200).json({
      ok: true,
      database: true,
      message: "Connexion Neon PostgreSQL réussie",
    });
  } catch (error) {
    console.error("PRISMA ERROR:", error);

    return res.status(500).json({
      ok: false,
      database: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}