import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const COOKIE_NAME = "silocamp_scan_session";

function normalizeTicketNumber(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function getSessionFromRequest(
  req: any,
): { username: string; exp: number } | null {
  try {
    const cookieHeader = req.headers?.cookie || "";

    const cookie = cookieHeader
      .split(";")
      .map((item: string) => item.trim())
      .find((item: string) =>
        item.startsWith(`${COOKIE_NAME}=`),
      );

    if (!cookie) {
      return null;
    }

    const session = decodeURIComponent(
      cookie.substring(COOKIE_NAME.length + 1),
    );

    const parts = session.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    const secret = process.env.SCANNER_SESSION_SECRET;

    if (!secret) {
      console.error(
        "[SiloCamp Validate] SCANNER_SESSION_SECRET manquant.",
      );

      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer,
      )
    ) {
      return null;
    }

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const data = JSON.parse(
      Buffer.from(normalizedPayload, "base64").toString("utf8"),
    ) as {
      username?: string;
      exp?: number;
    };

    if (
      !data ||
      typeof data.username !== "string" ||
      typeof data.exp !== "number"
    ) {
      return null;
    }

    if (Date.now() >= data.exp) {
      return null;
    }

    return {
      username: data.username,
      exp: data.exp,
    };
  } catch (error) {
    console.error(
      "[SiloCamp Validate Session]",
      error,
    );

    return null;
  }
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

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      valid: false,
      reason: "METHOD_NOT_ALLOWED",
      message: "Méthode non autorisée.",
    });
  }

  const session = getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({
      ok: false,
      valid: false,
      reason: "SCAN_UNAUTHORIZED",
      message:
        "Authentification requise pour valider les billets.",
    });
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "[SiloCamp Validate] DATABASE_URL manquante.",
    );

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "DATABASE_ERROR",
      message:
        "Configuration de la base de données manquante.",
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
    console.error(
      "[SiloCamp Validate Ticket Error]",
      error,
    );

    return res.status(500).json({
      ok: false,
      valid: false,
      reason: "SERVER_ERROR",
      message:
        error?.message ||
        "Erreur lors de la validation du billet.",
    });
  }
}