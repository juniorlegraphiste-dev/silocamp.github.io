import { neon } from "@neondatabase/serverless";

const MAX_TICKETS = 1200;

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
        COUNT(*) FILTER (WHERE status = 'VALID')::int AS "validTickets",
        COUNT(*) FILTER (WHERE status = 'USED')::int AS "usedTickets",
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS "cancelledTickets",
        COALESCE(
          SUM(quantity) FILTER (WHERE status IN ('VALID', 'USED')),
          0
        )::int AS reserved
      FROM "Ticket"
    `;

    const row = result[0];

    const validTickets = Number(row?.validTickets ?? 0);
    const usedTickets = Number(row?.usedTickets ?? 0);
    const cancelledTickets = Number(row?.cancelledTickets ?? 0);
    const reserved = Number(row?.reserved ?? 0);

    return res.status(200).json({
      ok: true,
      capacity: MAX_TICKETS,
      totalTickets:
        validTickets +
        usedTickets +
        cancelledTickets,
      validTickets,
      usedTickets,
      cancelledTickets,
      reserved,
      used: usedTickets,
      remaining: Math.max(
        0,
        MAX_TICKETS - reserved
      ),
    });
  } catch (error: any) {
    console.error("TICKETS STATS ERROR:", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Erreur lors de la récupération des statistiques.",
    });
  }
}