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

function normalizeInteger(value: unknown): number {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function calculateQuantity(children12Plus: unknown): number {
  const age12Plus = normalizeInteger(children12Plus);
  return 1 + age12Plus;
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

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? null;
}

function getRoute(req: any): string {
  const queryPath = req?.query?.path;

  if (Array.isArray(queryPath) && queryPath.length > 0) {
    return queryPath
      .join("/")
      .replace(/^\/+|\/+$/g, "");
  }

  if (typeof queryPath === "string" && queryPath.trim()) {
    return queryPath.replace(/^\/+|\/+$/g, "");
  }

  const possibleUrls = [
    req?.url,
    req?.originalUrl,
    req?.path,
  ]
    .filter(Boolean)
    .map((value: unknown) => String(value));

  for (const rawUrl of possibleUrls) {
    const pathname = rawUrl.split("?")[0];

    const apiIndex = pathname.indexOf("/api/");

    if (apiIndex >= 0) {
      return pathname
        .slice(apiIndex + "/api/".length)
        .replace(/^\/+|\/+$/g, "");
    }

    if (pathname === "/api") {
      return "";
    }

    const stripped = pathname.replace(/^\/+|\/+$/g, "");

    if (
      stripped === "tickets" ||
      stripped.startsWith("tickets/")
    ) {
      return stripped;
    }
  }

  return "";
}

async function getStats(sql: any) {
  const result = await sql`
    SELECT
      COUNT(*)::int AS "totalTickets",

      COUNT(*) FILTER (
        WHERE status = 'VALID'
      )::int AS "validTickets",

      COUNT(*) FILTER (
        WHERE status = 'USED'
      )::int AS "usedTickets",

      COUNT(*) FILTER (
        WHERE status = 'CANCELLED'
      )::int AS "cancelledTickets",

      COALESCE(
        SUM(quantity) FILTER (
          WHERE status IN ('VALID', 'USED')
        ),
        0
      )::int AS reserved,

      COALESCE(
        SUM(quantity) FILTER (
          WHERE status = 'USED'
        ),
        0
      )::int AS used

    FROM "Ticket"
  `;

  const row = result[0] ?? {};

  const reserved = Number(row.reserved ?? 0);
  const used = Number(row.used ?? 0);

  return {
    capacity: MAX_TICKETS,
    totalTickets: Number(row.totalTickets ?? 0),
    validTickets: Number(row.validTickets ?? 0),
    usedTickets: Number(row.usedTickets ?? 0),
    cancelledTickets: Number(row.cancelledTickets ?? 0),
    reserved,
    used,
    remaining: Math.max(0, MAX_TICKETS - reserved),
  };
}

async function getTicketSelect(sql: any, ticketNumber: string) {
  return sql`
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
    WHERE UPPER("ticketNumber") = ${ticketNumber}
    LIMIT 1
  `;
}

export default async function handler(req: any, res: any) {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return res.status(500).json({
      ok: false,
      error: "DATABASE_URL manquante.",
    });
  }

  const sql = neon(databaseUrl);
  const route = getRoute(req);

  console.log("[SiloCamp API]", {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    route,
  });

  try {
    if (route === "tickets") {
      if (req.method === "GET") {
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
      }

      if (req.method === "POST") {
        const body = req.body ?? {};

        const firstName = String(body.firstName ?? "").trim();
        const lastName = String(body.lastName ?? "").trim();

        const participantName =
          String(body.participantName ?? "").trim() ||
          `${firstName} ${lastName}`.trim();

        const email = normalizeEmail(body.email);
        const phone = normalizePhone(body.phone);

        const reservationId = String(body.reservationId ?? "").trim();
        const eventId = String(body.eventId ?? "").trim();
        const eventTitle = String(body.eventTitle ?? "").trim();
        const dateLabel = String(body.dateLabel ?? "").trim();
        const time = String(body.time ?? "").trim();

        const duration =
          body.duration !== undefined && body.duration !== null
            ? String(body.duration).trim()
            : null;

        const venue = String(body.venue ?? "").trim();
        const city = String(body.city ?? "").trim();

        const childrenUnder12 = normalizeInteger(
          body.childrenUnder12,
        );

        const children12Plus = normalizeInteger(
          body.children12Plus,
        );

        const quantity = calculateQuantity(children12Plus);

        if (!participantName) {
          return res.status(400).json({
            ok: false,
            error: "Le nom du participant est obligatoire.",
          });
        }

        if (!email) {
          return res.status(400).json({
            ok: false,
            error: "L'adresse email est obligatoire.",
          });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            ok: false,
            error: "Adresse email invalide.",
          });
        }

        if (!eventTitle) {
          return res.status(400).json({
            ok: false,
            error: "Le nom de l'événement est obligatoire.",
          });
        }

        if (!dateLabel) {
          return res.status(400).json({
            ok: false,
            error: "La date de l'événement est obligatoire.",
          });
        }

        if (!time) {
          return res.status(400).json({
            ok: false,
            error: "L'heure de l'événement est obligatoire.",
          });
        }

        if (!venue) {
          return res.status(400).json({
            ok: false,
            error: "Le lieu de l'événement est obligatoire.",
          });
        }

        if (!city) {
          return res.status(400).json({
            ok: false,
            error: "La ville de l'événement est obligatoire.",
          });
        }

        if (quantity < 1) {
          return res.status(400).json({
            ok: false,
            error: "Le nombre de places demandé est invalide.",
          });
        }

        const existingEmail = await sql`
          SELECT id
          FROM "Ticket"
          WHERE LOWER(TRIM(email)) = ${email}
          LIMIT 1
        `;

        if (existingEmail.length > 0) {
          return res.status(409).json({
            ok: false,
            error:
              "Cette adresse email possède déjà une réservation.",
          });
        }

        if (phone) {
          const existingPhone = await sql`
            SELECT id
            FROM "Ticket"
            WHERE REGEXP_REPLACE(
              COALESCE(phone, ''),
              '\s+',
              '',
              'g'
            ) = ${phone}
            LIMIT 1
          `;

          if (existingPhone.length > 0) {
            return res.status(409).json({
              ok: false,
              error:
                "Ce numéro de téléphone possède déjà une réservation.",
            });
          }
        }

        if (reservationId) {
          const existingReservation = await sql`
            SELECT id
            FROM "Ticket"
            WHERE "reservationId" = ${reservationId}
            LIMIT 1
          `;

          if (existingReservation.length > 0) {
            return res.status(409).json({
              ok: false,
              error: "Cette réservation existe déjà.",
            });
          }
        }

        const capacityResult = await sql`
          SELECT
            COALESCE(
              SUM(quantity) FILTER (
                WHERE status IN ('VALID', 'USED')
              ),
              0
            )::int AS reserved
          FROM "Ticket"
        `;

        const reserved = Number(
          capacityResult[0]?.reserved ?? 0,
        );

        const remaining = Math.max(
          0,
          MAX_TICKETS - reserved,
        );

        if (quantity > remaining) {
          return res.status(409).json({
            ok: false,
            error:
              remaining === 0
                ? "Il n'y a plus de place disponible."
                : `Il ne reste que ${remaining} place(s) disponible(s).`,
            capacity: MAX_TICKETS,
            reserved,
            requestedQuantity: quantity,
            remaining,
          });
        }

        const id = crypto.randomUUID();
        const ticketNumber = generateTicketNumber();
        const verificationToken =
          generateVerificationToken();

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
            ${id},
            ${ticketNumber},
            ${verificationToken},
            ${firstName || null},
            ${lastName || null},
            ${participantName},
            ${email},
            ${phone || null},
            ${reservationId || null},
            ${eventId || null},
            ${eventTitle},
            ${dateLabel},
            ${time},
            ${duration},
            ${venue},
            ${city},
            ${quantity},
            ${childrenUnder12},
            ${children12Plus},
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

        return res.status(201).json({
          ok: true,
          ticket: result[0],
        });
      }

      return res.status(405).json({
        ok: false,
        error: "Méthode non autorisée.",
      });
    }

    if (route === "tickets/stats") {
      if (req.method !== "GET") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const stats = await getStats(sql);

      return res.status(200).json({
        ok: true,
        ...stats,
      });
    }

    if (route === "tickets/verify") {
      if (req.method !== "POST") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const token = String(req.body?.token ?? "")
        .trim()
        .toLowerCase();

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
          message: "Billet introuvable.",
        });
      }

      const ticket = result[0];

      if (ticket.status === "CANCELLED") {
        return res.status(409).json({
          ok: false,
          valid: false,
          reason: "TICKET_CANCELLED",
          message: "Ce billet a été annulé.",
          ticket,
        });
      }

      if (ticket.status === "USED") {
        return res.status(409).json({
          ok: false,
          valid: false,
          reason: "TICKET_ALREADY_USED",
          message: "Ce billet a déjà été utilisé.",
          ticket,
        });
      }

      return res.status(200).json({
        ok: true,
        valid: true,
        reason: null,
        message: "Billet valide.",
        ticket,
      });
    }

    if (route === "tickets/validate") {
      if (req.method !== "POST") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const ticketNumber = String(
        req.body?.ticketNumber ?? "",
      )
        .trim()
        .toUpperCase();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de billet manquant.",
        });
      }

      const result = await getTicketSelect(
        sql,
        ticketNumber,
      );

      if (result.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Billet introuvable.",
        });
      }

      const ticket = result[0];

      if (ticket.status === "CANCELLED") {
        return res.status(409).json({
          ok: false,
          error: "Ce billet a été annulé.",
          ticket,
        });
      }

      if (ticket.status === "USED") {
        return res.status(409).json({
          ok: false,
          error: "Ce billet a déjà été utilisé.",
          ticket,
        });
      }

      const updated = await sql`
        UPDATE "Ticket"
        SET
          status = 'USED',
          "usedAt" = NOW()
        WHERE id = ${ticket.id}
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

      return res.status(200).json({
        ok: true,
        message: "Billet validé avec succès.",
        ticket: updated[0],
      });
    }

    if (route === "tickets/cancel") {
      if (req.method !== "POST") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const ticketNumber = String(
        req.body?.ticketNumber ?? "",
      )
        .trim()
        .toUpperCase();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de billet manquant.",
        });
      }

      const existing = await sql`
        SELECT
          id,
          status
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

      if (ticket.status === "CANCELLED") {
        return res.status(409).json({
          ok: false,
          error: "Ce billet est déjà annulé.",
        });
      }

      if (ticket.status === "USED") {
        return res.status(409).json({
          ok: false,
          error:
            "Un billet déjà utilisé ne peut pas être annulé.",
        });
      }

      const updated = await sql`
        UPDATE "Ticket"
        SET
          status = 'CANCELLED',
          "cancelledAt" = NOW()
        WHERE id = ${ticket.id}
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

      return res.status(200).json({
        ok: true,
        message: "Billet annulé avec succès.",
        ticket: updated[0],
      });
    }

    if (route.startsWith("tickets/number/")) {
      if (req.method !== "GET") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const ticketNumber = decodeURIComponent(
        route.substring("tickets/number/".length),
      )
        .trim()
        .toUpperCase();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de billet manquant.",
        });
      }

      const result = await getTicketSelect(
        sql,
        ticketNumber,
      );

      if (result.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Billet introuvable.",
        });
      }

      return res.status(200).json({
        ok: true,
        ticket: result[0],
      });
    }

    if (route.startsWith("tickets/email/")) {
      if (req.method !== "GET") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const email = normalizeEmail(
        decodeURIComponent(
          route.substring("tickets/email/".length),
        ),
      );

      if (!email) {
        return res.status(400).json({
          ok: false,
          error: "Adresse email manquante.",
        });
      }

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
        WHERE LOWER(TRIM(email)) = ${email}
        ORDER BY "createdAt" DESC
      `;

      return res.status(200).json({
        ok: true,
        tickets,
      });
    }

    if (route.startsWith("tickets/phone/")) {
      if (req.method !== "GET") {
        return res.status(405).json({
          ok: false,
          error: "Méthode non autorisée.",
        });
      }

      const phone = normalizePhone(
        decodeURIComponent(
          route.substring("tickets/phone/".length),
        ),
      );

      if (!phone) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de téléphone invalide.",
        });
      }

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
        WHERE REGEXP_REPLACE(
          COALESCE(phone, ''),
          '\s+',
          '',
          'g'
        ) = ${phone}
        ORDER BY "createdAt" DESC
      `;

      return res.status(200).json({
        ok: true,
        tickets,
      });
    }

    if (
      req.method === "DELETE" &&
      /^tickets\/[^/]+$/.test(route)
    ) {
      const ticketNumber = decodeURIComponent(
        route.substring("tickets/".length),
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
        SELECT
          id,
          "ticketNumber",
          status
        FROM "Ticket"
        WHERE UPPER("ticketNumber") = ${ticketNumber}
        LIMIT 1
      `;

      if (existing.length === 0) {
        console.log(
          "[SiloCamp DELETE] Billet introuvable :",
          ticketNumber,
        );

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

      console.log(
        "[SiloCamp DELETE] Suppression réussie :",
        ticketNumber,
      );

      return res.status(200).json({
        ok: true,
        success: true,
        message: "Participant supprimé avec succès.",
        ticketNumber,
      });
    }

    return res.status(404).json({
      ok: false,
      error: "Route API introuvable.",
      route,
    });
  } catch (error: any) {
    console.error("[SiloCamp API] Erreur :", error);

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Une erreur serveur est survenue.",
    });
  }
}