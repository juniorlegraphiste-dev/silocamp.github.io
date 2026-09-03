import { neon } from "@neondatabase/serverless";

function normalizeTicketNumber(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return res.status(500).json({
      ok: false,
      error: "DATABASE_URL manquante.",
    });
  }

  try {
    const sql = neon(databaseUrl);

    const ticketNumber = normalizeTicketNumber(
      req.body?.ticketNumber,
    );

    if (!ticketNumber) {
      return res.status(400).json({
        ok: false,
        error: "Numéro de billet manquant.",
      });
    }

    const result = await sql`
      UPDATE "Ticket"
      SET
        status = 'CANCELLED',
        "cancelledAt" = NOW()
      WHERE
        UPPER("ticketNumber") = ${ticketNumber}
        AND status = 'VALID'
      RETURNING
        id,
        "ticketNumber",
        "verificationToken",
        "firstName",
        "lastName",
        "participantName",
        email,
        phone,
        "reservationId",
        "eventId",
        "eventTitle",
        "dateLabel",
        time,
        duration,
        venue,
        city,
        quantity,
        status,
        "createdAt",
        "usedAt",
        "cancelledAt"
    `;

    if (result.length > 0) {
      return res.status(200).json({
        ok: true,
        message: "Billet annulé avec succès.",
        ticket: result[0],
      });
    }

    const existing = await sql`
      SELECT
        id,
        "ticketNumber",
        "verificationToken",
        "firstName",
        "lastName",
        "participantName",
        email,
        phone,
        "reservationId",
        "eventId",
        "eventTitle",
        "dateLabel",
        time,
        duration,
        venue,
        city,
        quantity,
        status,
        "createdAt",
        "usedAt",
        "cancelledAt"
      FROM "Ticket"
      WHERE UPPER("ticketNumber") = ${ticketNumber}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Billet introuvable.",
      });
    }

    const ticket = existing[0];

    if (ticket.status === "USED") {
      return res.status(409).json({
        ok: false,
        error:
          "Un billet déjà utilisé ne peut pas être annulé.",
        ticket,
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.status(409).json({
        ok: false,
        error: "Ce billet est déjà annulé.",
        ticket,
      });
    }

    return res.status(409).json({
      ok: false,
      error: "Ce billet ne peut pas être annulé.",
      ticket,
    });
  } catch (error: any) {
    console.error("CANCEL TICKET ERROR:", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Erreur lors de l'annulation du billet.",
    });
  }
}