import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import { neon } from "@neondatabase/serverless";

import crypto from "node:crypto";

/* =========================================================
   SILOCAMP API
   =========================================================

   Architecture :

   Vite + React
   Vercel Serverless Function
   Neon PostgreSQL

   UNE SEULE FUNCTION :

   api/index.ts

   Routes :

   PUBLIC

   GET  /api/health
   POST /api/tickets
   POST /api/tickets/verify
   POST /api/tickets/email

   ADMIN / SCANNER

   POST   /api/auth/login
   POST   /api/auth/logout
   GET    /api/auth/me

   GET    /api/tickets
   GET    /api/tickets/stats
   GET    /api/tickets/number/:ticketNumber
   GET    /api/tickets/email/:email
   GET    /api/tickets/phone/:phone

   POST   /api/tickets/validate
   POST   /api/tickets/cancel

   DELETE /api/tickets/:ticketNumber

========================================================= */


/* =========================================================
   CONSTANTES
========================================================= */

const MAX_TICKETS = 1200;

const COOKIE_NAME =
  "silocamp_scan_session";

const SESSION_DURATION_MS =
  8 * 60 * 60 * 1000;

const SESSION_MAX_AGE_SECONDS =
  8 * 60 * 60;

const SITE_URL =
  process.env.SITE_URL ||
  "https://silocamp.org";


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

function normalizeEmail(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}


function normalizePhone(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .replace(/[^\d+]/g, "");
}


function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
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


/* =========================================================
   ID INTERNE
========================================================= */

function generateId(): string {
  return (
    `c${Date.now().toString(36)}` +
    crypto.randomBytes(8).toString("hex")
  );
}


/* =========================================================
   NUMÉRO DE BILLET
========================================================= */

function generateTicketNumber(): string {
  const year =
    new Date().getFullYear();

  const randomPart =
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase();

  return `SILO-${year}-${randomPart}`;
}


/* =========================================================
   TOKEN QR
========================================================= */

function generateVerificationToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}


/* =========================================================
   ID RÉSERVATION
========================================================= */

function generateReservationId(): string {
  const year =
    new Date().getFullYear();

  const randomPart =
    crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase();

  return `RES-${year}-${randomPart}`;
}


/* =========================================================
   DATABASE
========================================================= */

function getDatabaseUrl():
  | string
  | undefined {
  return process.env.DATABASE_URL;
}


/* =========================================================
   ROUTING
========================================================= */

function getRoute(
  req: VercelRequest,
): string {

  const queryPath =
    req.query?.path;

  let pathname =
    Array.isArray(queryPath)
      ? queryPath.join("/")
      : String(queryPath ?? "");

  /*
     Fallback pour accès direct
  */

  if (!pathname) {

    const rawUrl =
      req.url || "/";

    const host =
      req.headers.host ||
      "localhost";

    const protocol =
      host.includes("localhost")
        ? "http"
        : "https";

    const url =
      new URL(
        rawUrl,
        `${protocol}://${host}`,
      );

    pathname =
      url.pathname;
  }

  pathname = pathname
    .replace(/^\/+/, "")
    .replace(/^api\/?/, "")
    .replace(/\/+$/, "");

  return pathname;
}


/* =========================================================
   COOKIE SESSION
========================================================= */

function createSession(
  username: string,
  secret: string,
): string {

  const payload =
    Buffer
      .from(
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

  const signature =
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

    const cookie =
      cookieHeader
        .split(";")
        .map(
          (item) =>
            item.trim(),
        )
        .find(
          (item) =>
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

    const parts =
      session.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      payload,
      signature,
    ] = parts;

    if (
      !payload ||
      !signature
    ) {
      return null;
    }

    const secret =
      process.env
        .SCANNER_SESSION_SECRET;

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
      Buffer.from(expectedSignature);

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

    const data =
      JSON.parse(
        Buffer
          .from(
            normalizedPayload,
            "base64",
          )
          .toString("utf8"),
      ) as {
        username?: string;
        exp?: number;
      };

    if (
      typeof data.username !==
        "string" ||
      typeof data.exp !==
        "number"
    ) {
      return null;
    }

    if (
      Date.now() >= data.exp
    ) {
      return null;
    }

    return {
      username:
        data.username,

      exp:
        data.exp,
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
   AUTHENTIFICATION
========================================================= */

async function handleAuth(
  route: string,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {


  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  if (
    route === "auth/login"
  ) {

    if (
      req.method !== "POST"
    ) {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message:
          "Méthode non autorisée.",
      });

      return true;
    }

    try {

      const login =
        normalizeString(
          req.body?.login,
        );

      const password =
        String(
          req.body?.password ?? "",
        );

      const expectedLogin =
        process.env
          .SCANNER_USERNAME;

      const expectedPassword =
        process.env
          .SCANNER_PASSWORD;

      const sessionSecret =
        process.env
          .SCANNER_SESSION_SECRET;

      if (
        !expectedLogin ||
        !expectedPassword ||
        !sessionSecret
      ) {

        console.error(
          "[SiloCamp Auth] Variables manquantes.",
        );

        res.status(500).json({
          ok: false,
          authenticated: false,
          message:
            "Configuration du serveur incomplète.",
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
        `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
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
          "Erreur du serveur.",
      });

      return true;
    }
  }


  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  if (
    route === "auth/logout"
  ) {

    if (
      req.method !== "POST"
    ) {
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
     AUTH ME
  ------------------------------------------------------- */

  if (
    route === "auth/me"
  ) {

    if (
      req.method !== "GET"
    ) {

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
      username:
        session.username,
    });

    return true;
  }

  return false;
}


/* =========================================================
   AUTHENTIFICATION OBLIGATOIRE
========================================================= */

function requireSession(
  req: VercelRequest,
  res: VercelResponse,
): {
  authenticated: boolean;
  username?: string;
} {

  const session =
    getSession(req);

  if (!session) {

    res.status(401).json({
      ok: false,
      authenticated: false,
      error:
        "Authentification requise.",
    });

    return {
      authenticated: false,
    };
  }

  return {
    authenticated: true,
    username:
      session.username,
  };
}


/* =========================================================
   STATISTIQUES
========================================================= */

async function getStats(
  sql: any,
) {

  const result =
    await sql`
      SELECT

        COUNT(*) FILTER (
          WHERE status = 'VALID'
        )::int
        AS "validTickets",

        COUNT(*) FILTER (
          WHERE status = 'USED'
        )::int
        AS "usedTickets",

        COUNT(*) FILTER (
          WHERE status = 'CANCELLED'
        )::int
        AS "cancelledTickets",

        COALESCE(
          SUM(quantity) FILTER (
            WHERE status IN (
              'VALID',
              'USED'
            )
          ),
          0
        )::int
        AS reserved

      FROM "Ticket"
    `;

  const row =
    result[0];

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
    capacity:
      MAX_TICKETS,

    totalTickets:
      validTickets +
      usedTickets +
      cancelledTickets,

    validTickets,

    usedTickets,

    cancelledTickets,

    reserved,

    used:
      usedTickets,

    remaining:
      Math.max(
        0,
        MAX_TICKETS -
          reserved,
      ),
  };
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value: unknown,
): string {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   ENVOI EMAIL
========================================================= */

async function sendTicketEmail(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {

  if (
    req.method !== "POST"
  ) {

    res.status(405).json({
      ok: false,
      error:
        "Méthode non autorisée.",
    });

    return;
  }

  const ticketNumber =
    normalizeString(
      req.body?.ticketNumber,
    ).toUpperCase();

  const email =
    normalizeEmail(
      req.body?.email,
    );

  const pdfBase64 =
    normalizeString(
      req.body?.pdfBase64,
    );

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

    return;
  }

  /*
     Protection taille PDF
  */

  if (
    pdfBase64.length >
    4_500_000
  ) {

    res.status(413).json({
      ok: false,
      error:
        "Le fichier PDF est trop volumineux.",
    });

    return;
  }

  const resendApiKey =
    process.env.RESEND_API_KEY;

  const resendFromEmail =
    process.env.RESEND_FROM_EMAIL;

  if (
    !resendApiKey ||
    !resendFromEmail
  ) {

    res.status(500).json({
      ok: false,
      error:
        "Configuration Resend incomplète.",
    });

    return;
  }

  const result =
    await sql`
      SELECT *
      FROM "Ticket"
      WHERE "ticketNumber" =
        ${ticketNumber}
      LIMIT 1
    `;

  const ticket =
    result[0] as
      | TicketRow
      | undefined;

  if (!ticket) {

    res.status(404).json({
      ok: false,
      error:
        "Billet introuvable.",
    });

    return;
  }

  if (
    normalizeEmail(ticket.email) !==
    email
  ) {

    res.status(403).json({
      ok: false,
      error:
        "Cette adresse email ne correspond pas au billet.",
    });

    return;
  }

  const participantName =
    escapeHtml(
      ticket.participantName,
    );

  const verificationUrl =
    `${SITE_URL}/ticket/verify?token=${encodeURIComponent(
      ticket.verificationToken,
    )}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">

<head>
<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>
Votre billet SiloCamp 2026
</title>

</head>

<body style="
margin:0;
padding:0;
background:#f5f1e8;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:620px;
margin:0 auto;
padding:40px 20px;
">

<div style="
background:#24104F;
border-radius:20px;
padding:40px;
color:#ffffff;
">

<h1 style="
margin:0 0 10px;
font-size:30px;
">
SiloCamp 2026
</h1>

<p style="
color:#C8A45D;
font-size:16px;
">
Camp International Silo
</p>

<p>
Bonjour ${participantName},
</p>

<p style="
font-size:16px;
line-height:1.6;
">
Votre réservation gratuite
a bien été enregistrée.
</p>

<div style="
background:#ffffff;
color:#24104F;
border-radius:14px;
padding:20px;
margin:25px 0;
">

<p style="
margin:0 0 8px;
font-size:13px;
color:#666;
">
NUMÉRO DE BILLET
</p>

<p style="
margin:0;
font-size:24px;
font-weight:bold;
">
${escapeHtml(ticket.ticketNumber)}
</p>

</div>

<div style="
background:#ffffff;
color:#24104F;
border-radius:14px;
padding:20px;
">

<h2>
${escapeHtml(ticket.eventTitle)}
</h2>

<p>
📅 ${escapeHtml(ticket.dateLabel)}
</p>

<p>
🕐 ${escapeHtml(ticket.time)}
</p>

<p>
📍 ${escapeHtml(ticket.venue)},
${escapeHtml(ticket.city)}
</p>

</div>

<p style="
margin-top:25px;
">
Votre billet PDF est joint
à cet email.
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
      ? (
          pdfBase64
            .split(",")
            .pop() || ""
        )
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

        body:
          JSON.stringify({

            from:
              resendFromEmail,

            to: [
              email,
            ],

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

    return;
  }

  res.status(200).json({
    ok: true,
    ticketNumber,
    email,
    resend:
      resendData,
  });
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

    if (
      route === "health"
    ) {

      if (
        req.method !== "GET"
      ) {

        return res
          .status(405)
          .json({
            ok: false,
            error:
              "Méthode non autorisée.",
          });
      }

      return res
        .status(200)
        .json({
          ok: true,
          message:
            "SiloCamp API fonctionne.",
          route:
            "health",
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

      return res
        .status(500)
        .json({
          ok: false,
          error:
            "DATABASE_URL manquante.",
        });
    }

    const sql =
      neon(databaseUrl);


    /* =====================================================
       EMAIL
    ===================================================== */

    if (
      route === "tickets/email" &&
      req.method === "POST"
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
       ADMIN
    ===================================================== */

    if (
      route === "tickets/stats" &&
      req.method === "GET"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const stats =
        await getStats(sql);

      return res
        .status(200)
        .json({
          ok: true,
          ...stats,
        });
    }


    /* =====================================================
       VERIFY QR
       PUBLIC
    ===================================================== */

    if (
      route === "tickets/verify" &&
      req.method === "POST"
    ) {

      const token =
        normalizeString(
          req.body?.token,
        ).toLowerCase();

      const ticketNumber =
        normalizeString(
          req.body?.ticketNumber,
        ).toUpperCase();

      if (
        !token &&
        !ticketNumber
      ) {

        return res
          .status(400)
          .json({
            ok: false,
            valid: false,
            reason:
              "TOKEN_REQUIRED",
            message:
              "Token ou numéro de billet requis.",
          });
      }

      let result;

      if (token) {

        if (
          !/^[a-f0-9]{64}$/.test(
            token,
          )
        ) {

          return res
            .status(400)
            .json({
              ok: true,
              valid: false,
              reason:
                "INVALID_TOKEN",
              message:
                "QR Code invalide.",
            });
        }

        result =
          await sql`
            SELECT *
            FROM "Ticket"
            WHERE "verificationToken" =
              ${token}
            LIMIT 1
          `;

      } else {

        result =
          await sql`
            SELECT *
            FROM "Ticket"
            WHERE "ticketNumber" =
              ${ticketNumber}
            LIMIT 1
          `;
      }

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (!ticket) {

        return res
          .status(200)
          .json({
            ok: true,
            valid: false,
            reason:
              "TICKET_NOT_FOUND",
            message:
              "Billet introuvable.",
          });
      }

      if (
        ticket.status ===
        "CANCELLED"
      ) {

        return res
          .status(200)
          .json({
            ok: true,
            valid: false,
            status:
              "CANCELLED",
            reason:
              "TICKET_CANCELLED",
            message:
              "Ce billet a été annulé.",
            ticket,
          });
      }

      if (
        ticket.status ===
        "USED"
      ) {

        return res
          .status(200)
          .json({
            ok: true,
            valid: false,
            status:
              "USED",
            reason:
              "TICKET_ALREADY_USED",
            message:
              "Ce billet a déjà été utilisé.",
            ticket,
          });
      }

      return res
        .status(200)
        .json({
          ok: true,
          valid: true,
          status:
            "VALID",
          message:
            "Billet valide. Accès autorisé.",
          ticket,
        });
    }


    /* =====================================================
       VALIDATE
       ADMIN / SCANNER
    ===================================================== */

    if (
      route === "tickets/validate" &&
      req.method === "POST"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const token =
        normalizeString(
          req.body?.token,
        ).toLowerCase();

      const ticketNumber =
        normalizeString(
          req.body?.ticketNumber,
        ).toUpperCase();

      if (
        !token &&
        !ticketNumber
      ) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "token ou ticketNumber requis.",
          });
      }

      let result;

      if (token) {

        result =
          await sql`
            UPDATE "Ticket"

            SET
              status = 'USED',
              "usedAt" = NOW()

            WHERE
              "verificationToken" =
                ${token}

              AND status = 'VALID'

            RETURNING *
          `;

      } else {

        result =
          await sql`
            UPDATE "Ticket"

            SET
              status = 'USED',
              "usedAt" = NOW()

            WHERE
              "ticketNumber" =
                ${ticketNumber}

              AND status = 'VALID'

            RETURNING *
          `;
      }

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (ticket) {

        return res
          .status(200)
          .json({
            ok: true,
            valid: true,
            status:
              "USED",
            message:
              "Billet validé avec succès.",
            ticket,
          });
      }

      let existing;

      if (token) {

        existing =
          await sql`
            SELECT *
            FROM "Ticket"
            WHERE "verificationToken" =
              ${token}
            LIMIT 1
          `;

      } else {

        existing =
          await sql`
            SELECT *
            FROM "Ticket"
            WHERE "ticketNumber" =
              ${ticketNumber}
            LIMIT 1
          `;
      }

      const existingTicket =
        existing[0] as
          | TicketRow
          | undefined;

      if (!existingTicket) {

        return res
          .status(404)
          .json({
            ok: false,
            reason:
              "TICKET_NOT_FOUND",
            message:
              "Billet introuvable.",
          });
      }

      if (
        existingTicket.status ===
        "USED"
      ) {

        return res
          .status(409)
          .json({
            ok: true,
            valid: false,
            status:
              "USED",
            reason:
              "TICKET_ALREADY_USED",
            message:
              "Ce billet a déjà été utilisé.",
            ticket:
              existingTicket,
          });
      }

      if (
        existingTicket.status ===
        "CANCELLED"
      ) {

        return res
          .status(409)
          .json({
            ok: true,
            valid: false,
            status:
              "CANCELLED",
            reason:
              "TICKET_CANCELLED",
            message:
              "Ce billet est annulé.",
            ticket:
              existingTicket,
          });
      }

      return res
        .status(409)
        .json({
          ok: false,
          message:
            "Impossible de valider ce billet.",
        });
    }


    /* =====================================================
       CANCEL
       ADMIN
    ===================================================== */

    if (
      route === "tickets/cancel" &&
      req.method === "POST"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const ticketNumber =
        normalizeString(
          req.body?.ticketNumber,
        ).toUpperCase();

      if (!ticketNumber) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "ticketNumber requis.",
          });
      }

      const result =
        await sql`
          UPDATE "Ticket"

          SET
            status = 'CANCELLED',
            "cancelledAt" = NOW()

          WHERE
            "ticketNumber" =
              ${ticketNumber}

            AND status = 'VALID'

          RETURNING *
        `;

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (ticket) {

        return res
          .status(200)
          .json({
            ok: true,
            status:
              "CANCELLED",
            message:
              "Billet annulé avec succès.",
            ticket,
          });
      }

      const existing =
        await sql`
          SELECT *
          FROM "Ticket"
          WHERE "ticketNumber" =
            ${ticketNumber}
          LIMIT 1
        `;

      const existingTicket =
        existing[0] as
          | TicketRow
          | undefined;

      if (!existingTicket) {

        return res
          .status(404)
          .json({
            ok: false,
            error:
              "Billet introuvable.",
          });
      }

      return res
        .status(409)
        .json({
          ok: false,
          status:
            existingTicket.status,
          message:
            "Impossible d'annuler ce billet.",
          ticket:
            existingTicket,
        });
    }


    /* =====================================================
       GET TICKET BY NUMBER
       ADMIN
    ===================================================== */

    if (
      route.startsWith(
        "tickets/number/",
      ) &&
      req.method === "GET"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const ticketNumber =
        decodeURIComponent(
          route.substring(
            "tickets/number/".length,
          ),
        )
          .trim()
          .toUpperCase();

      const result =
        await sql`
          SELECT *
          FROM "Ticket"
          WHERE "ticketNumber" =
            ${ticketNumber}
          LIMIT 1
        `;

      const ticket =
        result[0];

      if (!ticket) {

        return res
          .status(404)
          .json({
            ok: false,
            error:
              "Billet introuvable.",
          });
      }

      return res
        .status(200)
        .json({
          ok: true,
          ticket,
        });
    }


    /* =====================================================
       SEARCH EMAIL
       ADMIN
    ===================================================== */

    if (
      route.startsWith(
        "tickets/email/",
      ) &&
      req.method === "GET"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const email =
        normalizeEmail(
          decodeURIComponent(
            route.substring(
              "tickets/email/".length,
            ),
          ),
        );

      const result =
        await sql`
          SELECT *
          FROM "Ticket"

          WHERE LOWER(email) =
            ${email}

          ORDER BY
            "createdAt" DESC
        `;

      return res
        .status(200)
        .json({
          ok: true,
          tickets:
            result,
        });
    }


    /* =====================================================
       SEARCH PHONE
       ADMIN
    ===================================================== */

    if (
      route.startsWith(
        "tickets/phone/",
      ) &&
      req.method === "GET"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const phone =
        normalizePhone(
          decodeURIComponent(
            route.substring(
              "tickets/phone/".length,
            ),
          ),
        );

      const result =
        await sql`
          SELECT *
          FROM "Ticket"

          WHERE phone =
            ${phone}

          ORDER BY
            "createdAt" DESC
        `;

      return res
        .status(200)
        .json({
          ok: true,
          tickets:
            result,
        });
    }


    /* =====================================================
       DELETE
       ADMIN
    ===================================================== */

    if (
      route.startsWith("tickets/") &&
      req.method === "DELETE"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

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
          )
            .trim()
            .toUpperCase();

        const result =
          await sql`
            DELETE FROM "Ticket"

            WHERE "ticketNumber" =
              ${ticketNumber}

            RETURNING *
          `;

        const ticket =
          result[0];

        if (!ticket) {

          return res
            .status(404)
            .json({
              ok: false,
              error:
                "Billet introuvable.",
            });
        }

        return res
          .status(200)
          .json({
            ok: true,
            message:
              "Billet supprimé avec succès.",
            ticket,
          });
      }
    }


    /* =====================================================
       GET ALL TICKETS
       ADMIN
    ===================================================== */

    if (
      route === "tickets" &&
      req.method === "GET"
    ) {

      const auth =
        requireSession(
          req,
          res,
        );

      if (
        !auth.authenticated
      ) {
        return;
      }

      const result =
        await sql`
          SELECT *
          FROM "Ticket"

          ORDER BY
            "createdAt" DESC
        `;

      return res
        .status(200)
        .json({
          ok: true,
          tickets:
            result,
        });
    }


    /* =====================================================
       CREATE TICKET
       PUBLIC
    ===================================================== */

    if (
      route === "tickets" &&
      req.method === "POST"
    ) {

      const firstName =
        normalizeString(
          req.body?.firstName,
        );

      const lastName =
        normalizeString(
          req.body?.lastName,
        );

      const suppliedParticipantName =
        normalizeString(
          req.body?.participantName,
        );

      const participantName =
        suppliedParticipantName ||
        `${firstName} ${lastName}`
          .trim();

      const email =
        normalizeEmail(
          req.body?.email,
        );

      const phone =
        normalizePhone(
          req.body?.phone,
        );

      const eventId =
        normalizeString(
          req.body?.eventId,
        );

      const eventTitle =
        normalizeString(
          req.body?.eventTitle,
        );

      const dateLabel =
        normalizeString(
          req.body?.dateLabel,
        );

      const time =
        normalizeString(
          req.body?.time,
        );

      const duration =
        normalizeString(
          req.body?.duration,
        ) || null;

      const venue =
        normalizeString(
          req.body?.venue,
        );

      const city =
        normalizeString(
          req.body?.city,
        );

      /*
         SiloCamp :
         1 participant = 1 billet
      */

      const quantity = 1;


      /* VALIDATION */

      if (!participantName) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Nom du participant requis.",
          });
      }

      if (!email) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Email requis.",
          });
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email,
        )
      ) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Adresse email invalide.",
          });
      }

      if (!phone) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Numéro de téléphone requis.",
          });
      }

      if (!eventTitle) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Événement requis.",
          });
      }

      if (!dateLabel) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Date requise.",
          });
      }

      if (!time) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Heure requise.",
          });
      }

      if (!venue) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Lieu requis.",
          });
      }

      if (!city) {

        return res
          .status(400)
          .json({
            ok: false,
            error:
              "Ville requise.",
          });
      }


      /* CAPACITÉ */

      const stats =
        await getStats(sql);

      if (
        stats.reserved >=
        MAX_TICKETS
      ) {

        return res
          .status(409)
          .json({
            ok: false,
            reason:
              "CAPACITY_REACHED",
            error:
              "La capacité maximale est atteinte.",
            capacity:
              MAX_TICKETS,
            reserved:
              stats.reserved,
          });
      }


      /* EMAIL UNIQUE */

      const existingEmail =
        await sql`
          SELECT
            id,
            "ticketNumber",
            status

          FROM "Ticket"

          WHERE LOWER(email) =
            ${email}

          AND status IN (
            'VALID',
            'USED'
          )

          LIMIT 1
        `;

      if (
        existingEmail.length > 0
      ) {

        return res
          .status(409)
          .json({
            ok: false,
            reason:
              "DUPLICATE_EMAIL",
            error:
              "Une réservation existe déjà avec cet email.",
            ticket:
              existingEmail[0],
          });
      }


      /* PHONE UNIQUE */

      const existingPhone =
        await sql`
          SELECT
            id,
            "ticketNumber",
            status

          FROM "Ticket"

          WHERE phone =
            ${phone}

          AND status IN (
            'VALID',
            'USED'
          )

          LIMIT 1
        `;

      if (
        existingPhone.length > 0
      ) {

        return res
          .status(409)
          .json({
            ok: false,
            reason:
              "DUPLICATE_PHONE",
            error:
              "Une réservation existe déjà avec ce téléphone.",
            ticket:
              existingPhone[0],
          });
      }


      /* GÉNÉRATION */

      const id =
        generateId();

      const ticketNumber =
        generateTicketNumber();

      const verificationToken =
        generateVerificationToken();

      const reservationId =
        generateReservationId();


      /* INSERTION */

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

            "status",

            "createdAt",

            "usedAt",

            "cancelledAt"

          )

          VALUES (

            ${id},

            ${ticketNumber},

            ${verificationToken},

            ${firstName || null},

            ${lastName || null},

            ${participantName},

            ${email},

            ${phone},

            ${reservationId},

            ${eventId || null},

            ${eventTitle},

            ${dateLabel},

            ${time},

            ${duration},

            ${venue},

            ${city},

            ${quantity},

            ${0},

            ${0},

            'VALID',

            NOW(),

            NULL,

            NULL

          )

          RETURNING *
        `;

      const ticket =
        result[0] as
          | TicketRow
          | undefined;

      if (!ticket) {

        return res
          .status(500)
          .json({
            ok: false,
            error:
              "Impossible de créer le billet.",
          });
      }


      return res
        .status(201)
        .json({
          ok: true,

          message:
            "Réservation gratuite créée avec succès.",

          ticket,
        });
    }


    /* =====================================================
       ROUTE INCONNUE
    ===================================================== */

    return res
      .status(404)
      .json({
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


    /*
       DUPLICATE
    */

    if (
      error?.code === "23505"
    ) {

      return res
        .status(409)
        .json({
          ok: false,

          error:
            "Cette réservation existe déjà.",

          code:
            "DUPLICATE_RESOURCE",
        });
    }


    /*
       NOT NULL
    */

    if (
      error?.code === "23502"
    ) {

      return res
        .status(500)
        .json({
          ok: false,

          error:
            "Données obligatoires manquantes.",

          code:
            "DATABASE_NOT_NULL",
        });
    }


    return res
      .status(500)
      .json({
        ok: false,

        error:
          error?.message ||
          "Erreur interne du serveur.",
      });
  }
}