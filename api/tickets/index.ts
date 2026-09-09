import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const MAX_TICKETS = 1200;

function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeChildren(value: unknown): number {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function generateTicketNumber(): string {
  return `SILO-${new Date().getFullYear()}-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        return res.status(500).json({
          ok: false,
          error: "DATABASE_URL manquante.",
        });
      }

      const sql = neon(databaseUrl);

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
      console.error("[SiloCamp] GET /api/tickets ERROR:", error);

      return res.status(500).json({
        ok: false,
        error:
          error?.message ||
          "Erreur lors de la récupération des billets.",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        return res.status(500).json({
          ok: false,
          error: "DATABASE_URL manquante.",
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
        childrenUnder12,
        children12Plus,
      } = req.body ?? {};

      const normalizedFirstName = String(firstName ?? "").trim();

      const normalizedLastName = String(lastName ?? "").trim();

      const normalizedParticipantName =
        String(participantName ?? "").trim() ||
        `${normalizedFirstName} ${normalizedLastName}`.trim();

      const normalizedEmail = normalizeEmail(email);

      const normalizedPhone = normalizePhone(phone);

      const normalizedReservationId = String(
        reservationId ?? "",
      ).trim();

      /*
       * =========================================================
       * ENFANTS
       * =========================================================
       *
       * Moins de 12 ans :
       *   +0 place
       *
       * 12 ans ou plus :
       *   +1 place par enfant
       *
       * Participant :
       *   1 place obligatoire
       *
       * Exemple :
       *
       * 0 enfant 12+  => 1 place
       * 1 enfant 12+  => 2 places
       * 2 enfants 12+ => 3 places
       * 3 enfants 12+ => 4 places
       * =========================================================
       */

      const normalizedChildrenUnder12 =
        normalizeChildren(childrenUnder12);

      const normalizedChildren12Plus =
        normalizeChildren(children12Plus);

      const quantity = 1 + normalizedChildren12Plus;

      /*
       * =========================================================
       * VALIDATION DES INFORMATIONS
       * =========================================================
       */

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

      if (!eventTitle || !dateLabel || !time || !venue || !city) {
        return res.status(400).json({
          ok: false,
          error:
            "Les informations de l'événement sont incomplètes.",
        });
      }

      /*
       * =========================================================
       * EMAIL UNIQUE
       * =========================================================
       *
       * Une adresse email déjà utilisée reste bloquée,
       * même si le billet précédent est annulé.
       * =========================================================
       */

      const duplicateEmail = await sql`
        SELECT id
        FROM "Ticket"
        WHERE LOWER(TRIM(email)) = ${normalizedEmail}
        LIMIT 1
      `;

      if (duplicateEmail.length > 0) {
        return res.status(409).json({
          ok: false,
          error:
            "Cette adresse email possède déjà une réservation.",
        });
      }

      /*
       * =========================================================
       * TÉLÉPHONE UNIQUE
       * =========================================================
       */

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
            error:
              "Ce numéro de téléphone possède déjà une réservation.",
          });
        }
      }

      /*
       * =========================================================
       * RÉSERVATION UNIQUE
       * =========================================================
       */

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

      /*
       * =========================================================
       * CALCUL DES PLACES DÉJÀ RÉSERVÉES
       * =========================================================
       *
       * IMPORTANT :
       *
       * On additionne quantity.
       *
       * quantity contient déjà :
       *
       * 1 participant
       * +
       * enfants de 12 ans ou plus
       *
       * Les enfants de moins de 12 ans ne sont donc pas comptés.
       * =========================================================
       */

      const capacityResult = await sql`
        SELECT
          COALESCE(SUM(quantity), 0)::int AS reserved
        FROM "Ticket"
        WHERE status IN ('VALID', 'USED')
      `;

      const reserved = Number(
        capacityResult[0]?.reserved ?? 0,
      );

      const remaining = Math.max(
        0,
        MAX_TICKETS - reserved,
      );

      /*
       * =========================================================
       * VÉRIFICATION DE DISPONIBILITÉ
       * =========================================================
       */

      if (quantity > remaining) {
        return res.status(409).json({
          ok: false,
          error:
            remaining === 0
              ? "Il n'y a plus de place disponible."
              : `Il ne reste plus que ${remaining} place(s) disponible(s).`,
          capacity: MAX_TICKETS,
          reserved,
          remaining,
          requestedQuantity: quantity,
        });
      }

      /*
       * =========================================================
       * GÉNÉRATION DU BILLET
       * =========================================================
       */

      const ticketId = crypto.randomUUID();

      const ticketNumber = generateTicketNumber();

      const verificationToken =
        generateVerificationToken();

      /*
       * =========================================================
       * INSERTION NEON
       * =========================================================
       *
       * quantity est EXACTEMENT la même valeur que celle
       * utilisée pour le contrôle de disponibilité.
       *
       * quantity = 1 + children12Plus
       * =========================================================
       */

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
          "childrenUnder12",
          "children12Plus",
          status
        )
        VALUES (
          ${ticketId},
          ${ticketNumber},
          ${verificationToken},
          ${normalizedFirstName || null},
          ${normalizedLastName || null},
          ${normalizedParticipantName},
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
          ${quantity},
          ${normalizedChildrenUnder12},
          ${normalizedChildren12Plus},
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
          "childrenUnder12",
          "children12Plus",
          status,
          "createdAt",
          "usedAt",
          "cancelledAt"
      `;

      const ticket = result[0];

      /*
       * =========================================================
       * RÉPONSE
       * =========================================================
       */

      return res.status(201).json({
        ok: true,
        ticket,
      });
    } catch (error: any) {
      console.error(
        "[SiloCamp] POST /api/tickets ERROR:",
        error,
      );

      return res.status(500).json({
        ok: false,
        error:
          error?.message ||
          "Erreur lors de la création du billet.",
      });
    }
  }

  /*
   * =========================================================
   * MÉTHODE NON AUTORISÉE
   * =========================================================
   */

  return res.status(405).json({
    ok: false,
    error: "Méthode non autorisée.",
  });
}