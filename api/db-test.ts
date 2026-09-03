import { neon } from "@neondatabase/serverless";

export default async function handler(_req: any, res: any) {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        error: "DATABASE_URL manquante",
      });
    }

    const sql = neon(databaseUrl);

    const result = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Ticket'
      ORDER BY ordinal_position
    `;

    return res.status(200).json({
      ok: true,
      table: "Ticket",
      columns: result,
    });
  } catch (error: any) {
    console.error("TICKET TABLE TEST ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error?.message || "Erreur inconnue",
    });
  }
}