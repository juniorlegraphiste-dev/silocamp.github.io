import { neon } from "@neondatabase/serverless";
import { isScanAuthenticated } from "../auth/_session";

function normalizeTicketNumber(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function sanitizeTicket(ticket: any) {
  if (!ticket) {
    return ticket;
  }

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
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

  if (!isScanAuthenticated(req)) {
    return res.status(401).json({
      ok: false,
      valid: false,
      reason: "SCAN_UNAUTHORIZED",
      message: "Authentification requise.",
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
        valid: false,
        reason: "TICKET_NUMBER_REQUIRED",
        message: "Numéro de billet manquant.",
      });
    }

    const result = await sql`
      UPDATE "Ticket"
      SET
        status = 'USED',
        "usedAt" = NOW()
      WHERE
        UPPER("ticketNumber") = ${ticketNumber}
        AND status = 'VALID'
      RETURNING
        id,
        "ticketNumber",
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
        valid: true,
        reason: null,
        message: "Entrée validée avec succès.",
        ticket: sanitizeTicket(result[0]),
      });
    }

    const existing = await sql`
      SELECT
        id,
        "ticketNumber",
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
        valid: false,
        reason: "TICKET_NOT_FOUND",
        message: "Billet introuvable.",
      });
    }

    const ticket = existing[0];

    if (ticket.status === "USED") {
      return res.status(409).json({
        ok: false,
        valid: false,
        reason: "TICKET_ALREADY_USED",
        message: "Ce billet a déjà été utilisé.",
        ticket: sanitizeTicket(ticket),
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.status(410).json({
        ok: false,
        valid: false,
        reason: "TICKET_CANCELLED",
        message: "Ce billet a été annulé.",
        ticket: sanitizeTicket(ticket),
      });
    }

    return res.status(409).json({
      ok: false,
      valid: false,
      reason: "TICKET_NOT_VALID",
      message: "Ce billet ne peut pas être validé.",
      ticket: sanitizeTicket(ticket),
    });
  } catch (error: any) {
    console.error("VALIDATE TICKET ERROR:", error);

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "SERVER_ERROR",
      error:
        error?.message ||
        "Erreur lors de la validation du billet.",
    });
  }
}