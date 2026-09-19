import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

/* =========================================================
   CONFIGURATION
========================================================= */

const MAX_TICKETS = 1200;

const COOKIE_NAME = "silocamp_scan_session";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const SITE_URL =
  process.env.SITE_URL || "https://silocamp-github-io.vercel.app/";

/* =========================================================
   TYPES
========================================================= */

type TicketStatus =
  | "VALID"
  | "USED"
  | "CANCELLED";

type TicketRow = {
  id: string;

  ticketNumber: string;
  verificationToken: string;

  firstName: string | null;
  lastName: string | null;
  participantName: string;

  email: string;
  phone: string | null;

  reservationId: string | null;

  eventId: string | null;
  eventTitle: string;
  dateLabel: string;
  time: string;
  duration: string | null;
  venue: string;
  city: string;

  quantity: number;
  childrenUnder12: number;
  children12Plus: number;

  status: TicketStatus;

  createdAt: string;
  usedAt: string | null;
  cancelledAt: string | null;
};

/* =========================================================
   UTILITAIRES
========================================================= */

function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/[^\d+]/g, "");
}

function normalizeInteger(
  value: unknown,
  fallback = 0,
): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.floor(number);
}

function calculateQuantity(
  value: unknown,
): number {
  const quantity = normalizeInteger(value, 1);

  return Math.max(1, quantity);
}

function calculateChildren(
  value: unknown,
): number {
  const children = normalizeInteger(value, 0);

  return Math.max(0, children);
}

/* =========================================================
   GÉNÉRATION ID
========================================================= */

/**
 * Prisma @default(cuid()) ne fonctionne PAS
 * lorsqu'on utilise un INSERT SQL direct avec Neon.
 *
 * On génère donc nous-mêmes l'ID.
 */
function generateId(): string {
  return (
    `c${Date.now().toString(36)}` +
    crypto.randomBytes(8).toString("hex")
  );
}

function generateReservationId(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `RES-${year}-${randomPart}`;
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SILO-${year}-${randomPart}`;
}

function generateVerificationToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

/* =========================================================
   DATABASE
========================================================= */

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

/* =========================================================
   ROUTING
========================================================= */

function getRoute(
  req: VercelRequest,
): string {
  /*
   * Avec le vercel.json :
   *
   * /api/:path*
   * ->
   * /api/index?path=:path*
   *
   * On privilégie donc req.query.path.
   */

  const queryPath = req.query?.path;

  let pathname = Array.isArray(queryPath)
    ? queryPath.join("/")
    : String(queryPath ?? "");

  /*
   * Fallback utile en local ou si Vercel
   * ne transmet pas le paramètre path.
   */

  if (!pathname) {
    const rawUrl = req.url || "/";

    const base = req.headers.host
      ? `https://${req.headers.host}`
      : "http://localhost";

    pathname = new URL(
      rawUrl,
      base,
    ).pathname;
  }

  pathname = pathname
    .replace(/^\/+/, "")
    .replace(/^api\/?/, "")
    .replace(/\/+$/, "");

  return pathname;
}

/* =========================================================
   AUTHENTIFICATION SCANNER
========================================================= */

function createSession(
  username: string,
  secret: string,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      exp:
        Date.now() +
        SESSION_DURATION_MS,
    }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signature = crypto
    .createHmac(
      "sha256",
      secret,
    )
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${payload}.${signature}`;
}

function getSession(
  req: VercelRequest,
): {
  username: string;
  exp: number;
} | null {
  try {
    const cookieHeader =
      req.headers.cookie || "";

    const cookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) =>
        item.startsWith(
          `${COOKIE_NAME}=`,
        ),
      );

    if (!cookie) {
      return null;
    }

    const session =
      decodeURIComponent(
        cookie.substring(
          COOKIE_NAME.length + 1,
        ),
      );

    const parts = session.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] =
      parts;

    if (!payload || !signature) {
      return null;
    }

    const secret =
      process.env.SCANNER_SESSION_SECRET;

    if (!secret) {
      return null;
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret,
        )
        .update(payload)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    const signatureBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
      );

    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer,
      )
    ) {
      return null;
    }

    const normalizedPayload =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const data = JSON.parse(
      Buffer.from(
        normalizedPayload,
        "base64",
      ).toString("utf8"),
    ) as {
      username?: string;
      exp?: number;
    };

    if (
      typeof data.username !==
        "string" ||
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
      "[SiloCamp Auth Session]",
      error,
    );

    return null;
  }
}

/* =========================================================
   AUTH ROUTES
========================================================= */

async function handleAuth(
  route: string,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  if (route === "auth/login") {
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message:
          "Méthode non autorisée.",
      });

      return true;
    }

    try {
      const login = String(
        req.body?.login ?? "",
      ).trim();

      const password = String(
        req.body?.password ?? "",
      );

      const expectedLogin =
        process.env.SCANNER_USERNAME;

      const expectedPassword =
        process.env.SCANNER_PASSWORD;

      const sessionSecret =
        process.env.SCANNER_SESSION_SECRET;

      if (
        !expectedLogin ||
        !expectedPassword ||
        !sessionSecret
      ) {
        console.error(
          "[SiloCamp Auth] Variables d'environnement manquantes.",
        );

        res.status(500).json({
          ok: false,
          authenticated: false,
          message:
            "Configuration du serveur d'authentification incomplète.",
        });

        return true;
      }

      if (
        login !== expectedLogin ||
        password !== expectedPassword
      ) {
        res.status(401).json({
          ok: false,
          authenticated: false,
          message:
            "Identifiant ou mot de passe incorrect.",
        });

        return true;
      }

      const session =
        createSession(
          login,
          sessionSecret,
        );

      const cookie = [
        `${COOKIE_NAME}=${encodeURIComponent(
          session,
        )}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=28800",
        "Secure",
      ].join("; ");

      res.setHeader(
        "Set-Cookie",
        cookie,
      );

      res.status(200).json({
        ok: true,
        authenticated: true,
        message:
          "Authentification réussie.",
      });

      return true;
    } catch (error) {
      console.error(
        "[SiloCamp Auth Login]",
        error,
      );

      res.status(500).json({
        ok: false,
        authenticated: false,
        message:
          "Erreur du serveur d'authentification.",
      });

      return true;
    }
  }

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  if (route === "auth/logout") {
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message:
          "Méthode non autorisée.",
      });

      return true;
    }

    res.setHeader(
      "Set-Cookie",
      [
        `${COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
        "Secure",
      ].join("; "),
    );

    res.status(200).json({
      ok: true,
      authenticated: false,
      message:
        "Déconnexion réussie.",
    });

    return true;
  }

  /* -------------------------------------------------------
     ME
  ------------------------------------------------------- */

  if (route === "auth/me") {
    if (req.method !== "GET") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message:
          "Méthode non autorisée.",
      });

      return true;
    }

    const session =
      getSession(req);

    if (!session) {
      res.status(401).json({
        ok: true,
        authenticated: false,
      });

      return true;
    }

    res.status(200).json({
      ok: true,
      authenticated: true,
      username: session.username,
    });

    return true;
  }

  return false;
}

/* =========================================================
   STATISTIQUES
========================================================= */

async function getStats(
  sql: any,
) {
  const result = await sql`
    SELECT
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
      )::int AS reserved

    FROM "Ticket"
  `;

  const row = result[0];

  const validTickets =
    Number(
      row?.validTickets ?? 0,
    );

  const usedTickets =
    Number(
      row?.usedTickets ?? 0,
    );

  const cancelledTickets =
    Number(
      row?.cancelledTickets ?? 0,
    );

  const reserved =
    Number(
      row?.reserved ?? 0,
    );

  return {
    capacity: MAX_TICKETS,

    totalTickets:
      validTickets +
      usedTickets +
      cancelledTickets,

    validTickets,
    usedTickets,
    cancelledTickets,

    reserved,

    used: usedTickets,

    remaining: Math.max(
      0,
      MAX_TICKETS - reserved,
    ),
  };
}

/* =========================================================
   SELECT TICKET
========================================================= */

function ticketColumns(): string {
  return `
    "id",
    "ticketNumber",
    "verificationToken",
    "firstName",
    "lastName",
    "participantName",
    "email",
    "phone",
    "reservationId",
    "eventId",
    "eventTitle",
    "dateLabel",
    "time",
    "duration",
    "venue",
    "city",
    "quantity",
    "childrenUnder12",
    "children12Plus",
    "status",
    "createdAt",
    "usedAt",
    "cancelledAt"
  `;
}

/* =========================================================
   EMAIL TICKET
========================================================= */

async function sendTicketEmail(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      error:
        "Méthode non autorisée.",
    });

    return true;
  }

  try {
    const ticketNumber =
      String(
        req.body?.ticketNumber ?? "",
      ).trim();

    const email =
      normalizeEmail(
        req.body?.email,
      );

    const pdfBase64 =
      String(
        req.body?.pdfBase64 ?? "",
      ).trim();

    if (
      !ticketNumber ||
      !email ||
      !pdfBase64
    ) {
      res.status(400).json({
        ok: false,
        error:
          "ticketNumber, email et pdfBase64 sont requis.",
      });

      return true;
    }

    if (
      pdfBase64.length >
      4_500_000
    ) {
      res.status(413).json({
        ok: false,
        error:
          "Le fichier PDF est trop volumineux.",
      });

      return true;
    }

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (
      !resendApiKey ||
      !resendFromEmail
    ) {
      console.error(
        "[SiloCamp Email] Configuration Resend manquante.",
      );

      res.status(500).json({
        ok: false,
        error:
          "Configuration email incomplète.",
      });

      return true;
    }

    const result = await sql`
      SELECT
        "id",
        "ticketNumber",
        "verificationToken",
        "firstName",
        "lastName",
        "participantName",
        "email",
        "phone",
        "reservationId",
        "eventId",
        "eventTitle",
        "dateLabel",
        "time",
        "duration",
        "venue",
        "city",
        "quantity",
        "childrenUnder12",
        "children12Plus",
        "status",
        "createdAt",
        "usedAt",
        "cancelledAt"

      FROM "Ticket"

      WHERE "ticketNumber" =
        ${ticketNumber}

      LIMIT 1
    `;

    const ticket =
      result[0];

    if (!ticket) {
      res.status(404).json({
        ok: false,
        error:
          "Billet introuvable.",
      });

      return true;
    }

    const ticketEmail =
      normalizeEmail(
        ticket.email,
      );

    if (
      ticketEmail !== email
    ) {
      res.status(403).json({
        ok: false,
        error:
          "L'adresse email ne correspond pas au billet.",
      });

      return true;
    }

    const verificationToken =
      String(
        ticket.verificationToken ??
          "",
      );

    const verificationUrl =
      verificationToken
        ? `${SITE_URL}/ticket/verify?token=${encodeURIComponent(
            verificationToken,
          )}`
        : `${SITE_URL}/ticket/verify?ticketNumber=${encodeURIComponent(
            ticketNumber,
          )}`;

    const safeName =
      String(
        ticket.participantName ??
          "",
      ).replace(
        /[<>&"]/g,
        "",
      );

    const html = `
<!DOCTYPE html>

<html lang="fr">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    Votre billet SiloCamp 2026
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f1e8;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:620px;
      margin:0 auto;
      padding:40px 20px;
    "
  >

    <div
      style="
        background:#24104F;
        border-radius:20px;
        padding:40px;
        color:#ffffff;
      "
    >

      <h1
        style="
          margin:0 0 10px;
          font-size:30px;
        "
      >
        SiloCamp 2026
      </h1>

      <p
        style="
          margin:0 0 30px;
          color:#C8A45D;
          font-size:16px;
        "
      >
        Camp International Silo
      </p>

      <p
        style="
          font-size:17px;
          line-height:1.6;
        "
      >
        Bonjour ${safeName},
      </p>

      <p
        style="
          font-size:16px;
          line-height:1.6;
        "
      >
        Votre réservation gratuite
        pour le Camp International Silo 2026
        a bien été enregistrée.
      </p>

      <div
        style="
          background:#ffffff;
          color:#24104F;
          border-radius:14px;
          padding:20px;
          margin:25px 0;
        "
      >

        <p
          style="
            margin:0 0 8px;
            font-size:13px;
            color:#666;
          "
        >
          NUMÉRO DE BILLET
        </p>

        <p
          style="
            margin:0;
            font-size:24px;
            font-weight:bold;
          "
        >
          ${ticketNumber}
        </p>

      </div>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Votre billet PDF est joint
        à cet email.
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Conservez-le précieusement
        et présentez votre QR Code
        à votre arrivée.
      </p>

      <a
        href="${verificationUrl}"
        style="
          display:inline-block;
          margin-top:20px;
          padding:14px 22px;
          background:#C8A45D;
          color:#24104F;
          text-decoration:none;
          border-radius:10px;
          font-weight:bold;
        "
      >
        Vérifier mon billet
      </a>

    </div>

  </div>

</body>

</html>
`;

    const cleanBase64 =
      pdfBase64.includes(",")
        ? pdfBase64
            .split(",")
            .pop() || ""
        : pdfBase64;

    const resendResponse =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            from:
              resendFromEmail,

            to: [email],

            subject:
              `Votre billet SiloCamp 2026 — ${ticketNumber}`,

            html,

            attachments: [
              {
                filename:
                  `${ticketNumber}-SiloCamp-2026.pdf`,

                content:
                  cleanBase64,
              },
            ],
          }),
        },
      );

    const resendData =
      await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "[SiloCamp Resend]",
        resendData,
      );

      res.status(502).json({
        ok: false,
        error:
          "Impossible d'envoyer l'email.",
      });

      return true;
    }

    res.status(200).json({
      ok: true,
      ticketNumber,
      email,
    });

    return true;
  } catch (error: any) {
    console.error(
      "[SiloCamp Ticket Email]",
      error,
    );

    res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Erreur lors de l'envoi du billet par email.",
    });

    return true;
  }
}

/* =========================================================
   HANDLER PRINCIPAL
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const route =
      getRoute(req);

    /* =====================================================
       HEALTH
    ===================================================== */

    if (route === "health") {
      return res.status(200).json({
        ok: true,
        message:
          "SiloCamp API fonctionne",
        route: "health",
      });
    }

    /* =====================================================
       AUTH
    ===================================================== */

    const authHandled =
      await handleAuth(
        route,
        req,
        res,
      );

    if (authHandled) {
      return;
    }

    /* =====================================================
       DATABASE
    ===================================================== */

    const databaseUrl =
      getDatabaseUrl();

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        error:
          "DATABASE_URL manquante",
      });
    }

    const sql =
      neon(databaseUrl);

    /* =====================================================
       EMAIL
    ===================================================== */

    if (
      route ===
      "tickets/email"
    ) {
      await sendTicketEmail(
        sql,
        req,
        res,
      );

      return;
    }

    /* =====================================================
       STATS
    ===================================================== */

    if (
      route ===
        "tickets/stats" &&
      req.method === "GET"
    ) {
      const stats =
        await getStats(sql);

      return res.status(200).json({
        ok: true,
        ...stats,
      });
    }

    /* =====================================================
       VERIFY TICKET
    ===================================================== */

    if (
      route ===
        "tickets/verify" &&
      req.method === "POST"
    ) {
      const token =
        String(
          req.body?.token ??
            "",
        ).trim();

      const ticketNumber =
        String(
          req.body?.ticketNumber ??
            "",
        ).trim();

      if (
        !token &&
        !ticketNumber
      ) {
        return res.status(400).json({
          ok: false,
          valid: false,
          error:
            "token ou ticketNumber requis.",
        });
      }

      let result;

      if (token) {
        result = await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"
          WHERE
            "verificationToken" =
              ${token}
          LIMIT 1
        `;
      } else {
        result = await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"
          WHERE
            "ticketNumber" =
              ${ticketNumber}
          LIMIT 1
        `;
      }

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (!ticket) {
        return res.status(404).json({
          ok: false,
          valid: false,
          error:
            "Billet introuvable.",
        });
      }

      return res.status(200).json({
        ok: true,

        valid:
          ticket.status ===
          "VALID",

        ticket,
      });
    }

    /* =====================================================
       VALIDATE / SCANNER
    ===================================================== */

    if (
      route ===
        "tickets/validate" &&
      req.method === "POST"
    ) {
      const session =
        getSession(req);

      if (!session) {
        return res.status(401).json({
          ok: false,
          authenticated: false,
          error:
            "Authentification requise.",
        });
      }

      const token =
        String(
          req.body?.token ??
            "",
        ).trim();

      const ticketNumber =
        String(
          req.body?.ticketNumber ??
            "",
        ).trim();

      if (
        !token &&
        !ticketNumber
      ) {
        return res.status(400).json({
          ok: false,
          valid: false,
          error:
            "token ou ticketNumber requis.",
        });
      }

      let result;

      if (token) {
        result = await sql`
          UPDATE "Ticket"

          SET
            status = 'USED',
            "usedAt" = NOW()

          WHERE
            "verificationToken" =
              ${token}

            AND status = 'VALID'

          RETURNING
            ${sql.unsafe(
              ticketColumns(),
            )}
        `;
      } else {
        result = await sql`
          UPDATE "Ticket"

          SET
            status = 'USED',
            "usedAt" = NOW()

          WHERE
            "ticketNumber" =
              ${ticketNumber}

            AND status = 'VALID'

          RETURNING
            ${sql.unsafe(
              ticketColumns(),
            )}
        `;
      }

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (ticket) {
        return res.status(200).json({
          ok: true,
          valid: true,
          message:
            "Billet validé avec succès.",
          ticket,
        });
      }

      /* ---------------------------------------------------
         Recherche du billet existant
      --------------------------------------------------- */

      let existing;

      if (token) {
        existing = await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            "verificationToken" =
              ${token}

          LIMIT 1
        `;
      } else {
        existing = await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            "ticketNumber" =
              ${ticketNumber}

          LIMIT 1
        `;
      }

      const existingTicket =
        existing[0] as
          | TicketRow
          | undefined;

      if (!existingTicket) {
        return res.status(404).json({
          ok: false,
          valid: false,
          error:
            "Billet introuvable.",
        });
      }

      if (
        existingTicket.status ===
        "USED"
      ) {
        return res.status(409).json({
          ok: false,
          valid: false,
          error:
            "Ce billet a déjà été utilisé.",
          ticket:
            existingTicket,
        });
      }

      if (
        existingTicket.status ===
        "CANCELLED"
      ) {
        return res.status(409).json({
          ok: false,
          valid: false,
          error:
            "Ce billet est annulé.",
          ticket:
            existingTicket,
        });
      }

      return res.status(409).json({
        ok: false,
        valid: false,
        error:
          "Impossible de valider ce billet.",
        ticket:
          existingTicket,
      });
    }

    /* =====================================================
       CANCEL
    ===================================================== */

    if (
      route ===
        "tickets/cancel" &&
      req.method === "POST"
    ) {
      const ticketNumber =
        String(
          req.body?.ticketNumber ??
            "",
        ).trim();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error:
            "ticketNumber requis.",
        });
      }

      const result = await sql`
        UPDATE "Ticket"

        SET
          status = 'CANCELLED',
          "cancelledAt" = NOW()

        WHERE
          "ticketNumber" =
            ${ticketNumber}

          AND status = 'VALID'

        RETURNING
          ${sql.unsafe(
            ticketColumns(),
          )}
      `;

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (ticket) {
        return res.status(200).json({
          ok: true,
          message:
            "Billet annulé avec succès.",
          ticket,
        });
      }

      const existing =
        await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            "ticketNumber" =
              ${ticketNumber}

          LIMIT 1
        `;

      const existingTicket =
        existing[0] as
          | TicketRow
          | undefined;

      if (!existingTicket) {
        return res.status(404).json({
          ok: false,
          error:
            "Billet introuvable.",
        });
      }

      if (
        existingTicket.status ===
        "USED"
      ) {
        return res.status(409).json({
          ok: false,
          error:
            "Un billet déjà utilisé ne peut pas être annulé.",
          ticket:
            existingTicket,
        });
      }

      if (
        existingTicket.status ===
        "CANCELLED"
      ) {
        return res.status(409).json({
          ok: false,
          error:
            "Ce billet est déjà annulé.",
          ticket:
            existingTicket,
        });
      }

      return res.status(409).json({
        ok: false,
        error:
          "Impossible d'annuler ce billet.",
        ticket:
          existingTicket,
      });
    }

    /* =====================================================
       GET TICKET BY NUMBER
       /api/tickets/number/SILO-...
    ===================================================== */

    if (
      route.startsWith(
        "tickets/number/",
      ) &&
      req.method === "GET"
    ) {
      const ticketNumber =
        decodeURIComponent(
          route.substring(
            "tickets/number/"
              .length,
          ),
        ).trim();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error:
            "Numéro de billet requis.",
        });
      }

      const result =
        await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            "ticketNumber" =
              ${ticketNumber}

          LIMIT 1
        `;

      const ticket =
        result[0];

      if (!ticket) {
        return res.status(404).json({
          ok: false,
          error:
            "Billet introuvable.",
        });
      }

      return res.status(200).json({
        ok: true,
        ticket,
      });
    }

    /* =====================================================
       GET TICKETS BY EMAIL
       /api/tickets/email/:email
    ===================================================== */

    if (
      route.startsWith(
        "tickets/email/",
      ) &&
      req.method === "GET"
    ) {
      const email =
        normalizeEmail(
          decodeURIComponent(
            route.substring(
              "tickets/email/"
                .length,
            ),
          ),
        );

      if (!email) {
        return res.status(400).json({
          ok: false,
          error:
            "Email requis.",
        });
      }

      const result =
        await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            LOWER("email") =
              ${email}

          ORDER BY
            "createdAt" DESC
        `;

      return res.status(200).json({
        ok: true,
        tickets: result,
      });
    }

    /* =====================================================
       GET TICKETS BY PHONE
       /api/tickets/phone/:phone
    ===================================================== */

    if (
      route.startsWith(
        "tickets/phone/",
      ) &&
      req.method === "GET"
    ) {
      const phone =
        normalizePhone(
          decodeURIComponent(
            route.substring(
              "tickets/phone/"
                .length,
            ),
          ),
        );

      if (!phone) {
        return res.status(400).json({
          ok: false,
          error:
            "Téléphone requis.",
        });
      }

      const result =
        await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          WHERE
            "phone" =
              ${phone}

          ORDER BY
            "createdAt" DESC
        `;

      return res.status(200).json({
        ok: true,
        tickets: result,
      });
    }

    /* =====================================================
       DELETE TICKET
       DELETE /api/tickets/SILO-...
    ===================================================== */

    if (
      route.startsWith(
        "tickets/",
      ) &&
      req.method === "DELETE"
    ) {
      const suffix =
        route.substring(
          "tickets/".length,
        );

      if (
        suffix &&
        !suffix.includes("/")
      ) {
        const ticketNumber =
          decodeURIComponent(
            suffix,
          ).trim();

        const result =
          await sql`
            DELETE FROM "Ticket"

            WHERE
              "ticketNumber" =
                ${ticketNumber}

            RETURNING
              ${sql.unsafe(
                ticketColumns(),
              )}
          `;

        const ticket =
          result[0];

        if (!ticket) {
          return res.status(404).json({
            ok: false,
            error:
              "Billet introuvable.",
          });
        }

        return res.status(200).json({
          ok: true,
          message:
            "Billet supprimé avec succès.",
          ticket,
        });
      }
    }

    /* =====================================================
       GET ALL TICKETS
       GET /api/tickets
    ===================================================== */

    if (
      route === "tickets" &&
      req.method === "GET"
    ) {
      const result =
        await sql`
          SELECT
            ${sql.unsafe(
              ticketColumns(),
            )}
          FROM "Ticket"

          ORDER BY
            "createdAt" DESC
        `;

      return res.status(200).json({
        ok: true,
        tickets: result,
      });
    }

    /* =====================================================
       CREATE TICKET
       POST /api/tickets
    ===================================================== */

    if (
      route === "tickets" &&
      req.method === "POST"
    ) {
      /* ---------------------------------------------------
         DONNÉES PARTICIPANT
      --------------------------------------------------- */

      const firstName =
        String(
          req.body?.firstName ??
            "",
        ).trim();

      const lastName =
        String(
          req.body?.lastName ??
            "",
        ).trim();

      const participantName =
        String(
          req.body?.participantName ??
            "",
        ).trim();

      const email =
        normalizeEmail(
          req.body?.email,
        );

      const phone =
        normalizePhone(
          req.body?.phone,
        );

      /* ---------------------------------------------------
         DONNÉES RÉSERVATION
      --------------------------------------------------- */

      const reservationIdInput =
        String(
          req.body?.reservationId ??
            "",
        ).trim();

      const eventId =
        String(
          req.body?.eventId ??
            "",
        ).trim();

      const eventTitle =
        String(
          req.body?.eventTitle ??
            "",
        ).trim();

      const dateLabel =
        String(
          req.body?.dateLabel ??
            "",
        ).trim();

      const time =
        String(
          req.body?.time ??
            "",
        ).trim();

      const durationRaw =
        String(
          req.body?.duration ??
            "",
        ).trim();

      const venue =
        String(
          req.body?.venue ??
            "",
        ).trim();

      const city =
        String(
          req.body?.city ??
            "",
        ).trim();

      /* ---------------------------------------------------
         QUANTITÉ
      --------------------------------------------------- */

      const quantity =
        calculateQuantity(
          req.body?.quantity,
        );

      const childrenUnder12 =
        calculateChildren(
          req.body?.childrenUnder12,
        );

      const children12Plus =
        calculateChildren(
          req.body?.children12Plus,
        );

      /*
       * 1 participant = au minimum 1 place.
       *
       * Si des enfants de 12 ans ou plus
       * sont déclarés, ils occupent également
       * une place.
       */

      const calculatedMinimumQuantity =
        Math.max(
          1,
          1 + children12Plus,
        );

      const finalQuantity =
        Math.max(
          quantity,
          calculatedMinimumQuantity,
        );

      const duration =
        durationRaw || null;

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      const finalParticipantName =
        participantName ||
        `${firstName} ${lastName}`.trim();

      if (!finalParticipantName) {
        return res.status(400).json({
          ok: false,
          error:
            "Nom du participant requis.",
        });
      }

      if (!email) {
        return res.status(400).json({
          ok: false,
          error:
            "Email requis.",
        });
      }

      if (!phone) {
        return res.status(400).json({
          ok: false,
          error:
            "Numéro de téléphone requis.",
        });
      }

      if (!eventTitle) {
        return res.status(400).json({
          ok: false,
          error:
            "Nom de l'événement requis.",
        });
      }

      if (!dateLabel) {
        return res.status(400).json({
          ok: false,
          error:
            "Date de l'événement requise.",
        });
      }

      if (!time) {
        return res.status(400).json({
          ok: false,
          error:
            "Heure de l'événement requise.",
        });
      }

      if (!venue) {
        return res.status(400).json({
          ok: false,
          error:
            "Lieu de l'événement requis.",
        });
      }

      if (!city) {
        return res.status(400).json({
          ok: false,
          error:
            "Ville de l'événement requise.",
        });
      }

      /* ---------------------------------------------------
         CAPACITÉ
      --------------------------------------------------- */

      const stats =
        await getStats(sql);

      if (
        stats.reserved +
          finalQuantity >
        MAX_TICKETS
      ) {
        return res.status(409).json({
          ok: false,

          error:
            "La capacité maximale de l'événement est atteinte.",

          capacity:
            MAX_TICKETS,

          reserved:
            stats.reserved,

          remaining:
            stats.remaining,
        });
      }

      /* ---------------------------------------------------
         DOUBLON EMAIL
      --------------------------------------------------- */

      const existingEmail =
        await sql`
          SELECT
            "id",
            "ticketNumber",
            "participantName",
            "email",
            "phone",
            "status"

          FROM "Ticket"

          WHERE
            LOWER("email") =
              ${email}

            AND "status" IN (
              'VALID',
              'USED'
            )

          LIMIT 1
        `;

      if (
        existingEmail.length > 0
      ) {
        return res.status(409).json({
          ok: false,

          error:
            "Une réservation existe déjà pour cette adresse email.",

          ticket:
            existingEmail[0],
        });
      }

      /* ---------------------------------------------------
         DOUBLON TÉLÉPHONE
      --------------------------------------------------- */

      const existingPhone =
        await sql`
          SELECT
            "id",
            "ticketNumber",
            "participantName",
            "email",
            "phone",
            "status"

          FROM "Ticket"

          WHERE
            "phone" =
              ${phone}

            AND "status" IN (
              'VALID',
              'USED'
            )

          LIMIT 1
        `;

      if (
        existingPhone.length > 0
      ) {
        return res.status(409).json({
          ok: false,

          error:
            "Une réservation existe déjà pour ce numéro de téléphone.",

          ticket:
            existingPhone[0],
        });
      }

      /* ---------------------------------------------------
         RESERVATION ID
      --------------------------------------------------- */

      let reservationId =
        reservationIdInput ||
        generateReservationId();

      /*
       * Protection supplémentaire contre
       * une collision extrêmement improbable.
       */

      let reservationExists =
        await sql`
          SELECT
            "id"

          FROM "Ticket"

          WHERE
            "reservationId" =
              ${reservationId}

          LIMIT 1
        `;

      if (
        reservationExists.length >
        0
      ) {
        reservationId =
          generateReservationId();

        reservationExists =
          await sql`
            SELECT
              "id"

            FROM "Ticket"

            WHERE
              "reservationId" =
                ${reservationId}

            LIMIT 1
          `;

        if (
          reservationExists.length >
          0
        ) {
          return res.status(500).json({
            ok: false,
            error:
              "Impossible de générer un identifiant de réservation unique.",
          });
        }
      }

      /* ---------------------------------------------------
         GÉNÉRATION BILLET
      --------------------------------------------------- */

      const id =
        generateId();

      const ticketNumber =
        generateTicketNumber();

      const verificationToken =
        generateVerificationToken();

      /* ---------------------------------------------------
         INSERT
      --------------------------------------------------- */

      const result =
        await sql`
          INSERT INTO "Ticket" (

            "id",

            "ticketNumber",

            "verificationToken",

            "firstName",

            "lastName",

            "participantName",

            "email",

            "phone",

            "reservationId",

            "eventId",

            "eventTitle",

            "dateLabel",

            "time",

            "duration",

            "venue",

            "city",

            "quantity",

            "childrenUnder12",

            "children12Plus",

            "status"

          )

          VALUES (

            ${id},

            ${ticketNumber},

            ${verificationToken},

            ${firstName || null},

            ${lastName || null},

            ${finalParticipantName},

            ${email},

            ${phone || null},

            ${reservationId},

            ${eventId || null},

            ${eventTitle},

            ${dateLabel},

            ${time},

            ${duration},

            ${venue},

            ${city},

            ${finalQuantity},

            ${childrenUnder12},

            ${children12Plus},

            'VALID'

          )

          RETURNING
            ${sql.unsafe(
              ticketColumns(),
            )}
        `;

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (!ticket) {
        return res.status(500).json({
          ok: false,
          error:
            "Impossible de créer le billet.",
        });
      }

      /* ---------------------------------------------------
         RÉPONSE
      --------------------------------------------------- */

      return res.status(201).json({
        ok: true,

        message:
          "Réservation créée avec succès.",

        ticket,
      });
    }

    /* =====================================================
       ROUTE INCONNUE
    ===================================================== */

    return res.status(404).json({
      ok: false,

      error:
        "Route API introuvable.",

      route,
    });
  } catch (error: any) {
    console.error(
      "[SiloCamp API]",
      error,
    );

    return res.status(500).json({
      ok: false,

      error:
        error?.message ||
        "Erreur interne du serveur.",
    });
  }
}