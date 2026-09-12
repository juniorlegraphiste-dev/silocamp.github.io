import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");

    return res.status(405).json({
      ok: false,
      message: "Méthode non autorisée.",
    });
  }

  try {
    const rawTicketNumber = req.query?.ticketNumber;

    const ticketNumber = Array.isArray(rawTicketNumber)
      ? rawTicketNumber[0]
      : rawTicketNumber;

    const normalizedTicketNumber = String(ticketNumber ?? "")
      .trim()
      .toUpperCase();

    if (!normalizedTicketNumber) {
      return res.status(400).json({
        ok: false,
        message: "Numéro de billet manquant.",
      });
    }

    console.log(
      "[SiloCamp DELETE] Suppression demandée :",
      normalizedTicketNumber,
    );

    const existing = await sql`
      SELECT
        id,
        "ticketNumber"
      FROM "Ticket"
      WHERE UPPER("ticketNumber") = ${normalizedTicketNumber}
      LIMIT 1
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Participant introuvable.",
        ticketNumber: normalizedTicketNumber,
      });
    }

    await sql`
      DELETE FROM "Ticket"
      WHERE id = ${existing[0].id}
    `;

    console.log(
      "[SiloCamp DELETE] Suppression réussie :",
      normalizedTicketNumber,
    );

    return res.status(200).json({
      ok: true,
      success: true,
      message: "Participant supprimé avec succès.",
      ticketNumber: normalizedTicketNumber,
    });
  } catch (error) {
    console.error("[SiloCamp DELETE] Erreur serveur :", error);

    return res.status(500).json({
      ok: false,
      message: "Impossible de supprimer le participant.",
    });
  }
}