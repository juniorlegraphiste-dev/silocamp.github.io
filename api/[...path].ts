import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const MAX_TICKETS = 1200;

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}

function generateTicketNumber() {
  return `SILO-${new Date().getFullYear()}-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export default async function handler(req: any, res: any) {
  const path = Array.isArray(req.query?.path) ? req.query.path : [];

  const route = path.join("/");

  if (route === "tickets") {
    if (req.method === "GET") {
      try {
        const sql = neon(process.env.DATABASE_URL!);

        const tickets = await sql`
         
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
          "childrenUnder12",
          "children12Plus",
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
          error: error?.message || "Erreur tickets.",
        });
      }
    }

    if (req.method === "POST") {
      try {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
          return res.status(500).json({
            ok: false,
            error: "DATABASE_URL manquante",
          });
        }

        const sql = neon(databaseUrl);

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

        const normalizedEmail = normalizeEmail(email);
        const normalizedPhone = normalizePhone(phone);
        const normalizedReservationId = String(reservationId ?? "").trim();

        if (!participantName) {
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

        if (!eventTitle || !dateLabel || !time || !venue || !city) {
          return res.status(400).json({
            ok: false,
            error: "Les informations de l'événement sont incomplètes.",
          });
        }

        if (Number(quantity) !== 1) {
          return res.status(400).json({
            ok: false,
            error: "Une réservation correspond à une seule place.",
          });
        }

        const duplicateEmail = await sql`
          SELECT id
          FROM "Ticket"
          WHERE LOWER(TRIM(email)) = ${normalizedEmail}
          LIMIT 1
        `;

        if (duplicateEmail.length > 0) {
          return res.status(409).json({
            ok: false,
            error: "Cette adresse email possède déjà une réservation.",
          });
        }

        if (normalizedPhone) {
          const duplicatePhone = await sql`
            SELECT id
            FROM "Ticket"
            WHERE REGEXP_REPLACE(
              phone,
              '\\s+',
              '',
              'g'
            ) = ${normalizedPhone}
            LIMIT 1
          `;

          if (duplicatePhone.length > 0) {
            return res.status(409).json({
              ok: false,
              error: "Ce numéro de téléphone possède déjà une réservation.",
            });
          }
        }

        if (normalizedReservationId) {
          const duplicateReservation = await sql`
            SELECT id
            FROM "Ticket"
            WHERE "reservationId" = ${normalizedReservationId}
            LIMIT 1
          `;

          if (duplicateReservation.length > 0) {
            return res.status(409).json({
              ok: false,
              error: "Cette réservation existe déjà.",
            });
          }
        }

        const capacityResult = await sql`
          SELECT COALESCE(SUM(quantity), 0)::int AS reserved
          FROM "Ticket"
          WHERE status IN ('VALID', 'USED')
        `;

        const reserved = Number(capacityResult[0]?.reserved ?? 0);

        if (reserved >= MAX_TICKETS) {
          return res.status(409).json({
            ok: false,
            error: "Les 1200 places disponibles ont déjà été réservées.",
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
            ${firstName || null},
            ${lastName || null},
            ${participantName},
            ${normalizedEmail},
            ${normalizedPhone || null},
            ${normalizedReservationId || null},
            ${eventId || null},
            ${eventTitle},
            ${dateLabel},
            ${time},
            ${duration || null},
            ${venue},
            ${city},
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
          ticket: result[0],
        });
      } catch (error: any) {
        console.error("CREATE TICKET ERROR:", error);

        return res.status(500).json({
          ok: false,
          error: error?.message || "Erreur lors de la création du ticket.",
        });
      }
    }

    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });
  }

  return res.status(404).json({
    ok: false,
    error: "Route API introuvable.",
    route,
  });
}
