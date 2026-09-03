import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

export default async function handler(
  req: Request
): Promise<Response> {
  try {
    if (req.method !== "GET") {
      return Response.json(
        {
          ok: false,
          message: "Méthode non autorisée",
        },
        { status: 405 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return Response.json(
        {
          ok: false,
          database: false,
          message: "DATABASE_URL est absente.",
        },
        { status: 500 }
      );
    }

    const adapter = new PrismaNeon({
      connectionString: databaseUrl,
    });

    const prisma = new PrismaClient({
      adapter,
    });

    await prisma.$queryRaw`SELECT 1`;

    await prisma.$disconnect();

    return Response.json({
      ok: true,
      database: true,
      message: "Connexion Neon PostgreSQL réussie",
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    return Response.json(
      {
        ok: false,
        database: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}