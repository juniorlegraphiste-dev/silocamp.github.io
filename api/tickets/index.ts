import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const MAX_TICKETS = 1200;

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePhone(value: unknown): string {
  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(5).toString("hex").toUpperCase();

  return `SILO-${year}-${random}`;
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function sanitizeTicket(ticket: any) {
  if (!ticket) {
    return ticket;
  }

  return {
    ...ticket,
    verificationToken: ticket.verificationToken
      ? String(ticket.verificationToken)
      : "",
  };
}

export default async function handler(req: any, res: any) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return res.status(500).json({
      ok: false,
      error: "DATABASE_URL manquante.",
    });
  }

  const sql = neon(databaseUrl);

  if (req.method === "GET") {
    try {
      const tickets = await sql`
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
        ORDER BY "createdAt" DESC
      `;

      return res.status(200).json({
        ok: true,
        tickets,
      });
    } catch (error: any) {
      console.error("GET TICKETS ERROR:", error);

      return res.status(500).json({
        ok: false,
        error:
          error?.message ||
          "Erreur lors de la récupération des tickets.",
      });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });
  }

  try {
    const {
      firstName,
      lastName,
      participantName,
      email,
      phone,
      reservationId,
      eventId,
      eventTitle,
      dateLabel,
      time,
      duration,
      venue,
      city,
      quantity,
    } = req.body ?? {};

    const normalizedFirstName =
      String(firstName ?? "").trim() || null;

    const normalizedLastName =
      String(lastName ?? "").trim() || null;

    const normalizedParticipantName =
      String(participantName ?? "").trim() ||
      `${normalizedFirstName ?? ""} ${normalizedLastName ?? ""}`.trim();

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    const normalizedReservationId =
      String(reservationId ?? "").trim();

    const normalizedEventId =
      String(eventId ?? "").trim();

    const normalizedEventTitle =
      String(eventTitle ?? "").trim();

    const normalizedDateLabel =
      String(dateLabel ?? "").trim();

    const normalizedTime =
      String(time ?? "").trim();

    const normalizedDuration =
      String(duration ?? "").trim();

    const normalizedVenue =
      String(venue ?? "").trim();

    const normalizedCity =
      String(city ?? "").trim();

    const normalizedQuantity = Number(quantity ?? 1);

    if (!normalizedParticipantName) {
      return res.status(400).json({
        ok: false,
        error: "Le nom du participant est obligatoire.",
      });
    }

    if (!normalizedEmail) {
      return res.status(400).json({
        ok: false,
        error: "L'adresse email est obligatoire.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        ok: false,
        error: "L'adresse email est invalide.",
      });
    }

    if (
      !normalizedEventTitle ||
      !normalizedDateLabel ||
      !normalizedTime ||
      !normalizedVenue ||
      !normalizedCity
    ) {
      return res.status(400).json({
        ok: false,
        error: "Les informations de l'événement sont incomplètes.",
      });
    }

    if (normalizedQuantity !== 1) {
      return res.status(400).json({
        ok: false,
        error:
          "Une réservation correspond à une seule place.",
      });
    }

    const duplicateEmail = await sql`
      SELECT
        id,
        "ticketNumber",
        status
      FROM "Ticket"
      WHERE LOWER(TRIM(email)) = ${normalizedEmail}
      LIMIT 1
    `;

    if (duplicateEmail.length > 0) {
      return res.status(409).json({
        ok: false,
        error:
          "Cette adresse email possède déjà une réservation.",
        ticket: duplicateEmail[0],
      });
    }

    if (normalizedPhone) {
      const duplicatePhone = await sql`
        SELECT
          id,
          "ticketNumber",
          status
        FROM "Ticket"
        WHERE REGEXP_REPLACE(
          COALESCE(phone, ''),
          '\\s+',
          '',
          'g'
        ) = ${normalizedPhone}
        LIMIT 1
      `;

      if (duplicatePhone.length > 0) {
        return res.status(409).json({
          ok: false,
          error:
            "Ce numéro de téléphone possède déjà une réservation.",
          ticket: duplicatePhone[0],
        });
      }
    }

    if (normalizedReservationId) {
      const duplicateReservation = await sql`
        SELECT
          id,
          "ticketNumber",
          status
        FROM "Ticket"
        WHERE "reservationId" = ${normalizedReservationId}
        LIMIT 1
      `;

      if (duplicateReservation.length > 0) {
        return res.status(409).json({
          ok: false,
          error:
            "Cette réservation existe déjà.",
          ticket: duplicateReservation[0],
        });
      }
    }

    const capacityResult = await sql`
      SELECT
        COALESCE(SUM(quantity), 0)::int AS reserved
      FROM "Ticket"
      WHERE status IN ('VALID', 'USED')
    `;

    const reserved = Number(
      capacityResult[0]?.reserved ?? 0,
    );

    if (reserved >= MAX_TICKETS) {
      return res.status(409).json({
        ok: false,
        error:
          "Les 1200 places disponibles ont déjà été réservées.",
      });
    }

    const ticketNumber = generateTicketNumber();
    const verificationToken = generateVerificationToken();

    const result = await sql`
      INSERT INTO "Ticket" (
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
        status
      )
      VALUES (
        ${crypto.randomUUID()},
        ${ticketNumber},
        ${verificationToken},
        ${normalizedFirstName},
        ${normalizedLastName},
        ${normalizedParticipantName},
        ${normalizedEmail},
        ${normalizedPhone || null},
        ${normalizedReservationId || null},
        ${normalizedEventId || null},
        ${normalizedEventTitle},
        ${normalizedDateLabel},
        ${normalizedTime},
        ${normalizedDuration || null},
        ${normalizedVenue},
        ${normalizedCity},
        1,
        'VALID'
      )
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

    return res.status(201).json({
      ok: true,
      ticket: sanitizeTicket(result[0]),
    });
  } catch (error: any) {
    console.error("CREATE TICKET ERROR:", error);

    if (
      error?.code === "23505" ||
      String(error?.message ?? "").includes("unique")
    ) {
      return res.status(409).json({
        ok: false,
        error:
          "Une réservation identique existe déjà.",
      });
    }

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Erreur lors de la création du ticket.",
    });
  }
}