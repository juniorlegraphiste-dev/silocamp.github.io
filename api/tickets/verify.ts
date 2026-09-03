import { neon } from "@neondatabase/serverless";

function normalizeToken(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function sanitizeTicket(ticket: any) {
  if (!ticket) {
    return ticket;
  }

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    verificationToken: "",
    firstName: ticket.firstName,
    lastName: ticket.lastName,
    participantName: ticket.participantName,
    email: ticket.email,
    phone: ticket.phone,
    reservationId: ticket.reservationId,
    eventId: ticket.eventId,
    eventTitle: ticket.eventTitle,
    dateLabel: ticket.dateLabel,
    time: ticket.time,
    duration: ticket.duration,
    venue: ticket.venue,
    city: ticket.city,
    quantity: ticket.quantity,
    status: ticket.status,
    createdAt: ticket.createdAt,
    usedAt: ticket.usedAt,
    cancelledAt: ticket.cancelledAt,
  };
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

    const token = normalizeToken(
      req.body?.verificationToken,
    );

    if (!token) {
      return res.status(400).json({
        ok: false,
        valid: false,
        reason: "TOKEN_REQUIRED",
        message: "Token de vérification manquant.",
      });
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({
        ok: false,
        valid: false,
        reason: "INVALID_TOKEN",
        message: "QR Code invalide.",
      });
    }

    const result = await sql`
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
      WHERE "verificationToken" = ${token}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        ok: false,
        valid: false,
        reason: "TICKET_NOT_FOUND",
        message:
          "Billet introuvable ou QR Code invalide.",
      });
    }

    const ticket = result[0];

    if (ticket.status === "CANCELLED") {
      return res.status(410).json({
        ok: false,
        valid: false,
        reason: "TICKET_CANCELLED",
        message: "Ce billet a été annulé.",
        ticket: sanitizeTicket(ticket),
      });
    }

    if (ticket.status === "USED") {
      return res.status(409).json({
        ok: false,
        valid: false,
        reason: "TICKET_ALREADY_USED",
        message: "Ce billet a déjà été utilisé.",
        ticket: sanitizeTicket(ticket),
      });
    }

    return res.status(200).json({
      ok: true,
      valid: true,
      reason: null,
      message: "Billet valide.",
      ticket: sanitizeTicket(ticket),
    });
  } catch (error: any) {
    console.error("VERIFY TICKET ERROR:", error);

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "SERVER_ERROR",
      message:
        error?.message ||
        "Erreur lors de la vérification du billet.",
    });
  }
}