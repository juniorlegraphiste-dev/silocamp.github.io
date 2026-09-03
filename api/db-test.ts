export default async function handler(_req: any, res: any) {
  try {
    const { prisma } = await import("../server/db");

    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      ok: true,
      database: true,
      message: "Connexion Neon PostgreSQL réussie",
    });
  } catch (error) {
    console.error("PRISMA DB TEST ERROR:", error);

    return res.status(500).json({
      ok: false,
      database: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    });
  }
}