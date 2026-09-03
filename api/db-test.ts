import { neon } from "@neondatabase/serverless";

export default async function handler(_req: any, res: any) {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        database: false,
        error: "DATABASE_URL manquante",
      });
    }

    const sql = neon(databaseUrl);

    const result = await sql`
      SELECT
        current_database() AS database,
        current_schema() AS schema,
        NOW() AS server_time
    `;

    return res.status(200).json({
      ok: true,
      database: true,
      driver: "neon",
      result,
      message: "Connexion Neon PostgreSQL réussie",
    });
  } catch (error: any) {
    console.error("DATABASE TEST ERROR:", error);

    return res.status(500).json({
      ok: false,
      database: false,
      error: error?.message || "Erreur PostgreSQL inconnue",
    });
  }
}