import { neon } from "@neondatabase/serverless";

function normalizeToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sanitizeTicket(ticket: any) {
  if (!ticket) {
    return null;
  }

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,

    // IMPORTANT :
    // On ne renvoie jamais le vrai token secret.
    verificationToken: "",

    firstName: ticket.firstName ?? null,
    lastName: ticket.lastName ?? null,
    participantName: ticket.participantName,

    email: ticket.email,
    phone: ticket.phone ?? null,

    reservationId: ticket.reservationId ?? null,

    eventId: ticket.eventId ?? null,
    eventTitle: ticket.eventTitle,

    dateLabel: ticket.dateLabel,
    time: ticket.time,
    duration: ticket.duration ?? null,

    venue: ticket.venue,
    city: ticket.city,

    quantity: ticket.quantity ?? 1,

    childrenUnder12: Number(ticket.childrenUnder12 ?? 0),

    children12Plus: Number(ticket.children12Plus ?? 0),

    status: ticket.status,

    createdAt: ticket.createdAt,
    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      valid: false,
      reason: "METHOD_NOT_ALLOWED",
      message: "Méthode non autorisée.",
    });
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[SiloCamp Verify] DATABASE_URL manquante.");

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "DATABASE_ERROR",
      message: "Le service de vérification est temporairement indisponible.",
    });
  }

  try {
    const token = normalizeToken(req.body?.token);

    if (!token) {
      return res.status(400).json({
        ok: false,
        valid: false,
        reason: "TOKEN_REQUIRED",
        message: "Aucun code de vérification n'a été fourni.",
      });
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({
        ok: false,
        valid: false,
        reason: "INVALID_TOKEN",
        message: "Ce lien de vérification n'est pas valide.",
      });
    }

    const sql = neon(databaseUrl);

    const result = await sql`
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
        "childrenUnder12",
        "children12Plus",
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
        message: "Aucun billet correspondant à ce QR Code n'a été trouvé.",
      });
    }

    const ticket = result[0];

    /*
    =========================================
    BILLET ANNULÉ
    =========================================
    */

    if (ticket.status === "CANCELLED") {
      return res.status(410).json({
        ok: false,
        valid: false,
        reason: "TICKET_CANCELLED",
        message:
          "Ce billet a été annulé et ne permet plus l'accès à l'événement.",
        ticket: sanitizeTicket(ticket),
      });
    }

    /*
    =========================================
    BILLET DÉJÀ UTILISÉ
    =========================================
    */

    if (ticket.status === "USED") {
      return res.status(409).json({
        ok: false,
        valid: false,
        reason: "TICKET_ALREADY_USED",
        message: "Ce billet a déjà été enregistré comme utilisé.",
        ticket: sanitizeTicket(ticket),
      });
    }

    /*
    =========================================
    BILLET VALIDE
    =========================================
    */

    if (ticket.status === "VALID") {
      return res.status(200).json({
        ok: true,
        valid: true,
        reason: null,

        message: "Billet authentique et valide pour cet événement.",

        ticket: sanitizeTicket(ticket),
      });
    }

    /*
    =========================================
    STATUT INCONNU
    =========================================
    */

    return res.status(400).json({
      ok: false,
      valid: false,
      reason: "INVALID_STATUS",

      message: "Le statut de ce billet ne permet pas sa validation.",

      ticket: sanitizeTicket(ticket),
    });
  } catch (error: any) {
    console.error("[SiloCamp Verify Ticket Error]", error);

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "SERVER_ERROR",

      message: "Une erreur est survenue pendant la vérification du billet.",
    });
  }
}
