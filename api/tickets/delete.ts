import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });
  }

  try {
    const ticketNumber = String(
      req.query.ticketNumber ?? "",
    )
      .trim()
      .toUpperCase();

    if (!ticketNumber) {
      return res.status(400).json({
        ok: false,
        error: "Numéro de billet manquant.",
      });
    }

    console.log(
      "[SiloCamp DELETE] Suppression demandée :",
      ticketNumber,
    );

    const existing = await sql`
      SELECT id, "ticketNumber", status
      FROM "Ticket"
      WHERE UPPER("ticketNumber") = ${ticketNumber}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Participant introuvable.",
        ticketNumber,
      });
    }

    await sql`
      DELETE FROM "Ticket"
      WHERE id = ${existing[0].id}
    `;

    return res.status(200).json({
      ok: true,
      success: true,
      message: "Participant supprimé avec succès.",
      ticketNumber,
    });
  } catch (error) {
    console.error(
      "[SiloCamp DELETE] Erreur suppression :",
      error,
    );

    return res.status(500).json({
      ok: false,
      error: "Impossible de supprimer le participant.",
    });
  }
}