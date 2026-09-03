import { prisma } from "../server/db";

export default async function handler(_req: any, res: any) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      ok: true,
      database: true,
      message: "Connexion Neon PostgreSQL réussie",
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    res.status(500).json({
      ok: false,
      database: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}