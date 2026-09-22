import type { VercelRequest, VercelResponse } from "@vercel/node";

import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

/* =========================================================
   CONFIGURATION
========================================================= */

const DEFAULT_TICKET_CAPACITY = 1200;

const SETTINGS_ID = "default";

const COOKIE_NAME = "silocamp_scan_session";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const SITE_URL =
  process.env.SITE_URL || "https://silocamp-github-io.vercel.app";

/* =========================================================
   TYPES
========================================================= */

type TicketStatus = "VALID" | "USED" | "CANCELLED";

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

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  ticketId: string | null;
  read: boolean;
  createdAt: string;
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

function normalizeInteger(value: unknown, fallback = 0): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.floor(number);
}

function calculateQuantity(value: unknown): number {
  return Math.max(1, normalizeInteger(value, 1));
}

function calculateChildren(value: unknown): number {
  return Math.max(0, normalizeInteger(value, 0));
}

/* =========================================================
   GÉNÉRATION DES IDENTIFIANTS
========================================================= */

function generateId(prefix = "c"): string {
  return (
    prefix + Date.now().toString(36) + crypto.randomBytes(8).toString("hex")
  );
}

function generateReservationId(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();

  return `RES-${year}-${randomPart}`;
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

  return `SILO-${year}-${randomPart}`;
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/* =========================================================
   DATABASE
========================================================= */

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

/* =========================================================
   PARAMÈTRES SILOCAMP
========================================================= */

async function ensureSettingsTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS "SiloCampSettings" (
      "id" TEXT PRIMARY KEY,
      "eventName" TEXT NOT NULL,
      "eventDate" TEXT NOT NULL,
      "eventTime" TEXT NOT NULL,
      "eventLocation" TEXT NOT NULL DEFAULT '',
      "capacity" INTEGER NOT NULL DEFAULT 1200,
      "registrationsOpen" BOOLEAN NOT NULL DEFAULT TRUE,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    INSERT INTO "SiloCampSettings" (
      "id",
      "eventName",
      "eventDate",
      "eventTime",
      "eventLocation",
      "capacity",
      "registrationsOpen"
    )
    VALUES (
      ${SETTINGS_ID},
      'Camp International Silo 2026',
      '2026-09-22',
      '09:00',
      'Casablanca, Maroc',
      ${DEFAULT_TICKET_CAPACITY},
      TRUE
    )
    ON CONFLICT ("id") DO NOTHING
  `;
}

async function getSettings(sql: any) {
  await ensureSettingsTable(sql);

  const result = await sql`
    SELECT
      "id",
      "eventName",
      "eventDate",
      "eventTime",
      "eventLocation",
      "capacity",
      "registrationsOpen",
      "updatedAt"
    FROM "SiloCampSettings"
    WHERE "id" = ${SETTINGS_ID}
    LIMIT 1
  `;

  return result[0] ?? null;
}

function requireAdminSession(req: VercelRequest, res: VercelResponse): boolean {
  return requireSession(req, res);
}

/* =========================================================
   ROUTING
========================================================= */

function getRoute(req: VercelRequest): string {
  const queryPath = req.query?.path;

  let pathname = Array.isArray(queryPath)
    ? queryPath.join("/")
    : String(queryPath ?? "");

  if (!pathname) {
    const rawUrl = req.url || "/";

    const base = req.headers.host
      ? `https://${req.headers.host}`
      : "http://localhost";

    try {
      pathname = new URL(rawUrl, base).pathname;
    } catch {
      pathname = rawUrl;
    }
  }

  pathname = pathname
    .replace(/^\/+/, "")
    .replace(/^api\/?/, "")
    .replace(/\/+$/, "");

  return pathname;
}

/* =========================================================
   AUTHENTIFICATION
========================================================= */

function createSession(username: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      exp: Date.now() + SESSION_DURATION_MS,
    }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${payload}.${signature}`;
}

function getSession(req: VercelRequest): {
  username: string;
  exp: number;
} | null {
  try {
    const cookieHeader = req.headers.cookie || "";

    const cookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${COOKIE_NAME}=`));

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

    if (!payload || !signature) {
      return null;
    }

    const secret = process.env.SCANNER_SESSION_SECRET;

    if (!secret) {
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

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");

    const data = JSON.parse(
      Buffer.from(normalizedPayload, "base64").toString("utf8"),
    ) as {
      username?: string;
      exp?: number;
    };

    if (typeof data.username !== "string" || typeof data.exp !== "number") {
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
    console.error("[SiloCamp Auth Session]", error);

    return null;
  }
}

function requireSession(req: VercelRequest, res: VercelResponse): boolean {
  const session = getSession(req);

  if (!session) {
    res.status(401).json({
      ok: false,
      authenticated: false,
      error: "Authentification requise.",
    });

    return false;
  }

  return true;
}

/* =========================================================
   ROUTES AUTH
========================================================= */

async function handleAuth(
  route: string,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (route === "auth/login") {
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message: "Méthode non autorisée.",
      });

      return true;
    }

    try {
      const login = String(req.body?.login ?? "").trim();

      const password = String(req.body?.password ?? "");

      const expectedLogin = process.env.SCANNER_USERNAME;

      const expectedPassword = process.env.SCANNER_PASSWORD;

      const sessionSecret = process.env.SCANNER_SESSION_SECRET;

      if (!expectedLogin || !expectedPassword || !sessionSecret) {
        console.error("[SiloCamp Auth] Variables d'environnement manquantes.");

        res.status(500).json({
          ok: false,
          authenticated: false,
          message: "Configuration du serveur d'authentification incomplète.",
        });

        return true;
      }

      if (login !== expectedLogin || password !== expectedPassword) {
        res.status(401).json({
          ok: false,
          authenticated: false,
          message: "Identifiant ou mot de passe incorrect.",
        });

        return true;
      }

      const session = createSession(login, sessionSecret);

      const cookie = [
        `${COOKIE_NAME}=${encodeURIComponent(session)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=28800",
        "Secure",
      ].join("; ");

      res.setHeader("Set-Cookie", cookie);

      res.status(200).json({
        ok: true,
        authenticated: true,
        message: "Authentification réussie.",
      });

      return true;
    } catch (error) {
      console.error("[SiloCamp Auth Login]", error);

      res.status(500).json({
        ok: false,
        authenticated: false,
        message: "Erreur du serveur d'authentification.",
      });

      return true;
    }
  }

  if (route === "auth/logout") {
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message: "Méthode non autorisée.",
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
      message: "Déconnexion réussie.",
    });

    return true;
  }

  if (route === "auth/me") {
    if (req.method !== "GET") {
      res.status(405).json({
        ok: false,
        authenticated: false,
        message: "Méthode non autorisée.",
      });

      return true;
    }

    const session = getSession(req);

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

async function getStats(sql: any) {
  const result = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'VALID')::int AS "validTickets",
      COUNT(*) FILTER (WHERE status = 'USED')::int AS "usedTickets",
      COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS "cancelledTickets",
      COALESCE(SUM(quantity) FILTER (WHERE status IN ('VALID','USED')),0)::int AS reserved
    FROM "Ticket"
  `;
  const row = result[0];
  const validTickets = Number(row?.validTickets ?? 0);
  const usedTickets = Number(row?.usedTickets ?? 0);
  const cancelledTickets = Number(row?.cancelledTickets ?? 0);
  const reserved = Number(row?.reserved ?? 0);
  const settings = await getSettings(sql);
  const capacity = Number(settings?.capacity ?? DEFAULT_TICKET_CAPACITY);
  return {
    capacity,
    totalTickets: validTickets + usedTickets + cancelledTickets,
    validTickets,
    usedTickets,
    cancelledTickets,
    reserved,
    used: usedTickets,
    remaining: Math.max(0, capacity - reserved),
    registrationsOpen: Boolean(settings?.registrationsOpen ?? true),
  };
}

/* =========================================================
   COLONNES TICKET
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
   NOTIFICATIONS
========================================================= */

async function getNotifications(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "GET") {
    res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });

    return true;
  }

  if (!requireSession(req, res)) {
    return true;
  }

  try {
    const result = await sql`
        SELECT
          "id",
          "type",
          "title",
          "message",
          "ticketId",
          "read",
          "createdAt"
        FROM "Notification"
        ORDER BY
          "createdAt" DESC
        LIMIT 50
      `;

    const notifications: NotificationRow[] = result.map(
      (notification: any) => ({
        id: String(notification.id),

        type: String(notification.type ?? ""),

        title: String(notification.title ?? ""),

        message: String(notification.message ?? ""),

        ticketId:
          notification.ticketId !== null && notification.ticketId !== undefined
            ? String(notification.ticketId)
            : null,

        read: notification.read === true,

        createdAt: notification.createdAt,
      }),
    );

    const unreadCount = notifications.filter(
      (notification) => !notification.read,
    ).length;

    res.status(200).json({
      ok: true,
      notifications,
      unreadCount,
    });

    return true;
  } catch (error: any) {
    console.error("[SiloCamp Notifications GET]", error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Impossible de récupérer les notifications.",
    });

    return true;
  }
}

async function markNotificationAsRead(
  sql: any,
  route: string,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "PATCH") {
    res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });

    return true;
  }

  if (!requireSession(req, res)) {
    return true;
  }

  try {
    const prefix = "notifications/";

    const suffix = "/read";

    let notificationId = route;

    if (notificationId.startsWith(prefix)) {
      notificationId = notificationId.substring(prefix.length);
    }

    if (notificationId.endsWith(suffix)) {
      notificationId = notificationId.substring(
        0,
        notificationId.length - suffix.length,
      );
    }

    notificationId = decodeURIComponent(notificationId).trim();

    if (!notificationId) {
      res.status(400).json({
        ok: false,
        error: "Identifiant de notification requis.",
      });

      return true;
    }

    const result = await sql`
        UPDATE "Notification"
        SET
          "read" = true
        WHERE
          "id" = ${notificationId}
        RETURNING
          "id",
          "type",
          "title",
          "message",
          "ticketId",
          "read",
          "createdAt"
      `;

    if (result.length === 0) {
      res.status(404).json({
        ok: false,
        error: "Notification introuvable.",
      });

      return true;
    }

    res.status(200).json({
      ok: true,
      notification: result[0],
    });

    return true;
  } catch (error: any) {
    console.error("[SiloCamp Notification Read]", error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Impossible de modifier la notification.",
    });

    return true;
  }
}

async function markAllNotificationsAsRead(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "PATCH") {
    res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });

    return true;
  }

  if (!requireSession(req, res)) {
    return true;
  }

  try {
    const result = await sql`
        UPDATE "Notification"
        SET
          "read" = true
        WHERE
          "read" = false
        RETURNING "id"
      `;

    res.status(200).json({
      ok: true,
      message: "Toutes les notifications ont été marquées comme lues.",
      updatedCount: result.length,
    });

    return true;
  } catch (error: any) {
    console.error("[SiloCamp Notifications Read All]", error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Impossible de modifier les notifications.",
    });

    return true;
  }
}

/* =========================================================
   EMAIL DU BILLET
========================================================= */

async function sendTicketEmail(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });

    return true;
  }

  try {
    const ticketNumber = String(req.body?.ticketNumber ?? "").trim();

    const email = normalizeEmail(req.body?.email);

    const pdfBase64 = String(req.body?.pdfBase64 ?? "").trim();

    if (!ticketNumber || !email || !pdfBase64) {
      res.status(400).json({
        ok: false,
        error: "ticketNumber, email et pdfBase64 sont requis.",
      });

      return true;
    }

    if (pdfBase64.length > 4_500_000) {
      res.status(413).json({
        ok: false,
        error: "Le fichier PDF est trop volumineux.",
      });

      return true;
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !resendFromEmail) {
      res.status(500).json({
        ok: false,
        error: "Configuration email incomplète.",
      });

      return true;
    }

    const result = await sql`
        SELECT
          "id",
          "ticketNumber",
          "verificationToken",
          "participantName",
          "email"
        FROM "Ticket"
        WHERE
          "ticketNumber" =
            ${ticketNumber}
        LIMIT 1
      `;

    const ticket = result[0];

    if (!ticket) {
      res.status(404).json({
        ok: false,
        error: "Billet introuvable.",
      });

      return true;
    }

    if (normalizeEmail(ticket.email) !== email) {
      res.status(403).json({
        ok: false,
        error: "L'adresse email ne correspond pas au billet.",
      });

      return true;
    }

    const verificationToken = String(ticket.verificationToken ?? "");

    const verificationUrl = verificationToken
      ? `${SITE_URL}/ticket/verify?token=${encodeURIComponent(
          verificationToken,
        )}`
      : `${SITE_URL}/ticket/verify?ticketNumber=${encodeURIComponent(
          ticketNumber,
        )}`;

    const safeName = String(ticket.participantName ?? "").replace(
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
  <title>SiloCamp 2026</title>
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
        pour le Camp International Silo
        2026 a bien été enregistrée.
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

    const cleanBase64 = pdfBase64.includes(",")
      ? pdfBase64.split(",").pop() || ""
      : pdfBase64;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${resendApiKey}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        from: resendFromEmail,

        to: [email],

        subject: `Votre billet SiloCamp 2026 — ${ticketNumber}`,

        html,

        attachments: [
          {
            filename: `${ticketNumber}-SiloCamp-2026.pdf`,

            content: cleanBase64,
          },
        ],
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[SiloCamp Resend]", resendData);

      res.status(502).json({
        ok: false,
        error: "Impossible d'envoyer l'email.",
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
    console.error("[SiloCamp Ticket Email]", error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Erreur lors de l'envoi du billet par email.",
    });

    return true;
  }
}

/* =========================================================
   NEWSLETTER / CONTACT
========================================================= */

async function subscribeNewsletter(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Méthode non autorisée." });
    return true;
  }
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ ok: false, error: "Adresse e-mail invalide." });
      return true;
    }
    const apiKey = process.env.RESEND_API_KEY,
      from = process.env.RESEND_FROM_EMAIL,
      to = process.env.CONTACT_RECEIVER_EMAIL;
    if (!apiKey || !from || !to) {
      res
        .status(500)
        .json({ ok: false, error: "Configuration email incomplète." });
      return true;
    }
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "[SiloCamp] Nouvelle inscription newsletter",
        html: `<p>Nouvelle inscription newsletter SiloCamp :</p><p><strong>${email.replace(/[&<>\"]/g, "")}</strong></p>`,
      }),
    });
    if (!r.ok) {
      console.error("[Newsletter/Resend]", await r.text());
      res
        .status(502)
        .json({ ok: false, error: "Impossible d'envoyer l'inscription." });
      return true;
    }
    res
      .status(200)
      .json({ ok: true, message: "Inscription enregistrée avec succès." });
    return true;
  } catch (e: any) {
    console.error("[Newsletter]", e);
    res.status(500).json({
      ok: false,
      error: e?.message || "Erreur lors de l'inscription.",
    });
    return true;
  }
}

async function sendContactEmail(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Méthode non autorisée." });
    return true;
  }
  try {
    const name = String(req.body?.name ?? "").trim(),
      email = normalizeEmail(req.body?.email),
      phone = String(req.body?.phone ?? "").trim(),
      subject = String(req.body?.subject ?? "").trim(),
      message = String(req.body?.message ?? "").trim();
    if (
      !name ||
      !email ||
      !subject ||
      !message ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      res.status(400).json({
        ok: false,
        error: "Veuillez remplir correctement les champs obligatoires.",
      });
      return true;
    }
    if (
      name.length > 150 ||
      email.length > 254 ||
      subject.length > 200 ||
      message.length > 5000
    ) {
      res.status(400).json({
        ok: false,
        error: "La longueur d'un ou plusieurs champs est invalide.",
      });
      return true;
    }
    const apiKey = process.env.RESEND_API_KEY,
      from = process.env.RESEND_FROM_EMAIL,
      to = process.env.CONTACT_RECEIVER_EMAIL;
    if (!apiKey || !from || !to) {
      res
        .status(500)
        .json({ ok: false, error: "Configuration email incomplète." });
      return true;
    }
    const esc = (v: string) =>
      v.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[c] || c,
      );
    const html = `<div style="font-family:Arial,sans-serif"><h2>Nouveau message Contact — SiloCamp 2026</h2><p><strong>Nom :</strong> ${esc(name)}</p><p><strong>Email :</strong> ${esc(email)}</p><p><strong>Téléphone :</strong> ${esc(phone || "Non renseigné")}</p><p><strong>Sujet :</strong> ${esc(subject)}</p><hr/><p>${esc(message).replace(/\n/g, "<br/>")}</p></div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[SiloCamp Contact] ${subject}`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("[Contact/Resend]", await r.text());
      res
        .status(502)
        .json({ ok: false, error: "Impossible d'envoyer le message." });
      return true;
    }
    res
      .status(200)
      .json({ ok: true, message: "Votre message a été envoyé avec succès." });
    return true;
  } catch (e: any) {
    console.error("[Contact]", e);
    res.status(500).json({
      ok: false,
      error: e?.message || "Erreur lors de l'envoi du message.",
    });
    return true;
  }
}

/* =========================================================
   ANNULATION
========================================================= */

async function cancelTicket(
  sql: any,
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      error: "Méthode non autorisée.",
    });

    return true;
  }

  try {
    // -------------------------------------------------------
    // RÉCUPÉRATION DES DONNÉES
    // -------------------------------------------------------

    const ticketNumber = String(req.body?.ticketNumber ?? "").trim();

    const email = normalizeEmail(req.body?.email);

    if (!ticketNumber || !email) {
      res.status(400).json({
        ok: false,
        error: "Le numéro du billet et l'adresse email sont requis.",
      });

      return true;
    }

    console.log("[SiloCamp Cancel] Demande reçue :", {
      ticketNumber,
      email,
    });

    // -------------------------------------------------------
    // RECHERCHE DU BILLET
    // -------------------------------------------------------
    //
    // On utilise LOWER + TRIM pour éviter les problèmes :
    // - SILO-2026-ABC123
    // - silo-2026-abc123
    // - espaces accidentels
    //
    // -------------------------------------------------------

    const existingResult = await sql`
      SELECT
        ${sql.unsafe(ticketColumns())}
      FROM "Ticket"
      WHERE
        LOWER(TRIM("ticketNumber")) =
          LOWER(TRIM(${ticketNumber}))
      LIMIT 1
    `;

    const existingTicket = existingResult[0] as TicketRow | undefined;

    // -------------------------------------------------------
    // BILLET INTROUVABLE
    // -------------------------------------------------------

    if (!existingTicket) {
      console.error("[SiloCamp Cancel] Billet introuvable :", ticketNumber);

      res.status(404).json({
        ok: false,
        error: "Billet introuvable.",
      });

      return true;
    }

    // -------------------------------------------------------
    // VÉRIFICATION EMAIL
    // -------------------------------------------------------

    const existingEmail = normalizeEmail(existingTicket.email);

    if (existingEmail !== email) {
      console.error("[SiloCamp Cancel] Email incorrect :", {
        ticketNumber,
        emailReceived: email,
        emailStored: existingEmail,
      });

      res.status(403).json({
        ok: false,
        error: "L'adresse email ne correspond pas au billet.",
      });

      return true;
    }

    // -------------------------------------------------------
    // BILLET DÉJÀ UTILISÉ
    // -------------------------------------------------------

    if (existingTicket.status === "USED") {
      res.status(409).json({
        ok: false,
        error: "Un billet déjà utilisé ne peut pas être annulé.",
        ticket: existingTicket,
      });

      return true;
    }

    // -------------------------------------------------------
    // BILLET DÉJÀ ANNULÉ
    // -------------------------------------------------------

    if (existingTicket.status === "CANCELLED") {
      res.status(409).json({
        ok: false,
        error: "Ce billet est déjà annulé.",
        ticket: existingTicket,
      });

      return true;
    }

    // -------------------------------------------------------
    // ANNULATION
    // -------------------------------------------------------

    const result = await sql`
      UPDATE "Ticket"
      SET
        "status" = 'CANCELLED',
        "cancelledAt" = NOW()
      WHERE
        "id" = ${existingTicket.id}
        AND "status" = 'VALID'
      RETURNING
        ${sql.unsafe(ticketColumns())}
    `;

    const ticket = result[0] as TicketRow | undefined;

    // -------------------------------------------------------
    // ÉCHEC DE L'ANNULATION
    // -------------------------------------------------------

    if (!ticket) {
      console.error(
        "[SiloCamp Cancel] Impossible de mettre à jour le billet :",
        existingTicket.id,
      );

      res.status(409).json({
        ok: false,
        error: "Impossible d'annuler ce billet. Son statut a peut-être changé.",
      });

      return true;
    }

    // -------------------------------------------------------
    // NOTIFICATION ADMIN
    // -------------------------------------------------------

    let notificationCreated = false;

    try {
      const notificationId = generateId("notif_");

      const participantName =
        String(ticket.participantName ?? "").trim() || "Un participant";

      await sql`
        INSERT INTO "Notification" (
          "id",
          "type",
          "title",
          "message",
          "ticketId",
          "read",
          "createdAt"
        )
        VALUES (
          ${notificationId},
          'TICKET_CANCELLED',
          'Billet annulé',
          ${`${participantName} a annulé le billet ${ticket.ticketNumber}.`},
          ${ticket.id},
          false,
          NOW()
        )
      `;

      notificationCreated = true;

      console.log("[SiloCamp Cancel] Notification créée :", notificationId);
    } catch (notificationError) {
      console.error("[SiloCamp Notification - Annulation]", notificationError);
    }

    // -------------------------------------------------------
    // RÉPONSE
    // -------------------------------------------------------

    console.log(
      "[SiloCamp Cancel] Billet annulé avec succès :",
      ticket.ticketNumber,
    );

    res.status(200).json({
      ok: true,
      message: "Billet annulé avec succès.",
      ticket,
      notificationCreated,
    });

    return true;
  } catch (error: any) {
    console.error("[SiloCamp Ticket Cancel]", error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Erreur lors de l'annulation du billet.",
    });

    return true;
  }
}

/* =========================================================
   HANDLER PRINCIPAL
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const route = getRoute(req);

    /* =====================================================
       HEALTH
    ===================================================== */

    if (route === "health") {
      return res.status(200).json({
        ok: true,
        message: "SiloCamp API fonctionne",
        route: "health",
      });
    }

    /* =====================================================
       AUTH
    ===================================================== */

    const authHandled = await handleAuth(route, req, res);

    if (authHandled) {
      return;
    }

    /* =====================================================
       DATABASE
    ===================================================== */

    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      return res.status(500).json({
        ok: false,
        error: "DATABASE_URL manquante",
      });
    }

    const sql = neon(databaseUrl);

    /* =====================================================
   PARAMÈTRES PUBLICS DE L'ÉVÉNEMENT
===================================================== */

    if (route === "public/settings" && req.method === "GET") {
      const settings = await getSettings(sql);

      if (!settings) {
        return res.status(404).json({
          ok: false,
          error: "Paramètres de l'événement introuvables.",
        });
      }

      return res.status(200).json({
        ok: true,
        settings: {
          eventName: settings.eventName,
          eventDate: settings.eventDate,
          eventTime: settings.eventTime,
          eventLocation: settings.eventLocation,
          capacity: Number(settings.capacity),
          registrationsOpen: Boolean(settings.registrationsOpen),
        },
      });
    }

    /* =====================================================
       SETTINGS
    ===================================================== */
    if (route === "settings" && req.method === "GET") {
      if (!requireAdminSession(req, res)) return;
      const settings = await getSettings(sql);
      return res.status(200).json({ ok: true, settings });
    }

    if (route === "settings" && req.method === "PATCH") {
      if (!requireAdminSession(req, res)) return;
      const current = await getSettings(sql);
      if (!current)
        return res
          .status(500)
          .json({ ok: false, error: "Configuration SiloCamp introuvable." });
      const eventName = String(req.body?.eventName ?? current.eventName).trim();
      const eventDate = String(req.body?.eventDate ?? current.eventDate).trim();
      const eventTime = String(req.body?.eventTime ?? current.eventTime).trim();
      const eventLocation = String(
        req.body?.eventLocation ?? current.eventLocation ?? "",
      ).trim();
      const capacity = Number(req.body?.capacity ?? current.capacity);
      const registrationsOpen =
        req.body?.registrationsOpen === undefined
          ? Boolean(current.registrationsOpen)
          : Boolean(req.body.registrationsOpen);
      if (!eventName || !eventDate || !eventTime)
        return res.status(400).json({
          ok: false,
          error: "Le nom, la date et l'heure de l'événement sont obligatoires.",
        });
      if (!Number.isInteger(capacity) || capacity < 1)
        return res.status(400).json({
          ok: false,
          error: "La capacité doit être un nombre entier supérieur à 0.",
        });
      const stats = await getStats(sql);
      if (capacity < stats.reserved)
        return res.status(409).json({
          ok: false,
          error: `La capacité ne peut pas être inférieure aux ${stats.reserved} places déjà réservées.`,
          capacity,
          reserved: stats.reserved,
        });
      const result = await sql`
        UPDATE "SiloCampSettings" SET
          "eventName"=${eventName}, "eventDate"=${eventDate}, "eventTime"=${eventTime},
          "eventLocation"=${eventLocation}, "capacity"=${capacity},
          "registrationsOpen"=${registrationsOpen}, "updatedAt"=CURRENT_TIMESTAMP
        WHERE "id"=${SETTINGS_ID}
        RETURNING "id","eventName","eventDate","eventTime","eventLocation","capacity","registrationsOpen","updatedAt"
      `;
      return res.status(200).json({
        ok: true,
        message: "Paramètres enregistrés avec succès.",
        settings: result[0],
      });
    }

    if (route === "newsletter") {
      await subscribeNewsletter(req, res);
      return;
    }
    if (route === "contact") {
      await sendContactEmail(req, res);
      return;
    }

    /* =====================================================
       NOTIFICATIONS
       
       IMPORTANT :
       read-all AVANT :id/read
    ===================================================== */

    if (route === "notifications" && req.method === "GET") {
      await getNotifications(sql, req, res);

      return;
    }

    if (route === "notifications/read-all" && req.method === "PATCH") {
      await markAllNotificationsAsRead(sql, req, res);

      return;
    }

    if (
      route.startsWith("notifications/") &&
      route.endsWith("/read") &&
      req.method === "PATCH"
    ) {
      await markNotificationAsRead(sql, route, req, res);

      return;
    }

    /* =====================================================
       EMAIL
    ===================================================== */

    if (route === "tickets/email") {
      await sendTicketEmail(sql, req, res);

      return;
    }

    /* =====================================================
       STATS
    ===================================================== */

    if (route === "tickets/stats" && req.method === "GET") {
      const stats = await getStats(sql);

      return res.status(200).json({
        ok: true,
        ...stats,
      });
    }

    /* =====================================================
       VERIFY TICKET
    ===================================================== */

    if (route === "tickets/verify" && req.method === "POST") {
      const token = String(req.body?.token ?? "").trim();

      const ticketNumber = String(req.body?.ticketNumber ?? "").trim();

      if (!token && !ticketNumber) {
        return res.status(400).json({
          ok: false,
          valid: false,
          error: "token ou ticketNumber requis.",
        });
      }

      let result;

      if (token) {
        result = await sql`
            SELECT
              ${sql.unsafe(ticketColumns())}
            FROM "Ticket"
            WHERE
              "verificationToken" =
                ${token}
            LIMIT 1
          `;
      } else {
        result = await sql`
            SELECT
              ${sql.unsafe(ticketColumns())}
            FROM "Ticket"
            WHERE
              "ticketNumber" =
                ${ticketNumber}
            LIMIT 1
          `;
      }

      const ticket = result[0] as TicketRow | undefined;

      if (!ticket) {
        return res.status(404).json({
          ok: false,
          valid: false,
          error: "Billet introuvable.",
        });
      }

      return res.status(200).json({
        ok: true,
        valid: ticket.status === "VALID",
        ticket,
      });
    }

    /* =====================================================
       VALIDATE / SCANNER
    ===================================================== */

    if (route === "tickets/validate" && req.method === "POST") {
      if (!requireSession(req, res)) {
        return;
      }

      const token = String(req.body?.token ?? "").trim();

      const ticketNumber = String(req.body?.ticketNumber ?? "").trim();

      if (!token && !ticketNumber) {
        return res.status(400).json({
          ok: false,
          valid: false,
          error: "token ou ticketNumber requis.",
        });
      }

      let result;

      if (token) {
        result = await sql`
            UPDATE "Ticket"
            SET
              "status" = 'USED',
              "usedAt" = NOW()
            WHERE
              "verificationToken" =
                ${token}
              AND "status" =
                'VALID'
            RETURNING
              ${sql.unsafe(ticketColumns())}
          `;
      } else {
        result = await sql`
            UPDATE "Ticket"
            SET
              "status" = 'USED',
              "usedAt" = NOW()
            WHERE
              "ticketNumber" =
                ${ticketNumber}
              AND "status" =
                'VALID'
            RETURNING
              ${sql.unsafe(ticketColumns())}
          `;
      }

      const ticket = result[0] as TicketRow | undefined;

      if (ticket) {
        return res.status(200).json({
          ok: true,
          valid: true,
          message: "Billet validé avec succès.",
          ticket,
        });
      }

      let existing;

      if (token) {
        existing = await sql`
            SELECT
              ${sql.unsafe(ticketColumns())}
            FROM "Ticket"
            WHERE
              "verificationToken" =
                ${token}
            LIMIT 1
          `;
      } else {
        existing = await sql`
            SELECT
              ${sql.unsafe(ticketColumns())}
            FROM "Ticket"
            WHERE
              "ticketNumber" =
                ${ticketNumber}
            LIMIT 1
          `;
      }

      const existingTicket = existing[0] as TicketRow | undefined;

      if (!existingTicket) {
        return res.status(404).json({
          ok: false,
          valid: false,
          error: "Billet introuvable.",
        });
      }

      if (existingTicket.status === "USED") {
        return res.status(409).json({
          ok: false,
          valid: false,
          error: "Ce billet a déjà été utilisé.",
          ticket: existingTicket,
        });
      }

      if (existingTicket.status === "CANCELLED") {
        return res.status(409).json({
          ok: false,
          valid: false,
          error: "Ce billet est annulé.",
          ticket: existingTicket,
        });
      }

      return res.status(409).json({
        ok: false,
        valid: false,
        error: "Impossible de valider ce billet.",
        ticket: existingTicket,
      });
    }

    /* =====================================================
       CANCEL TICKET
    ===================================================== */

    if (route === "tickets/cancel") {
      await cancelTicket(sql, req, res);

      return;
    }

    /* =====================================================
       GET TICKET BY NUMBER
    ===================================================== */

    if (route.startsWith("tickets/number/") && req.method === "GET") {
      const ticketNumber = decodeURIComponent(
        route.substring("tickets/number/".length),
      ).trim();

      if (!ticketNumber) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de billet requis.",
        });
      }

      const result = await sql`
          SELECT
            ${sql.unsafe(ticketColumns())}
          FROM "Ticket"
          WHERE
            "ticketNumber" =
              ${ticketNumber}
          LIMIT 1
        `;

      const ticket = result[0];

      if (!ticket) {
        return res.status(404).json({
          ok: false,
          error: "Billet introuvable.",
        });
      }

      return res.status(200).json({
        ok: true,
        ticket,
      });
    }

    /* =====================================================
       GET TICKETS BY EMAIL
    ===================================================== */

    if (route.startsWith("tickets/email/") && req.method === "GET") {
      const email = normalizeEmail(
        decodeURIComponent(route.substring("tickets/email/".length)),
      );

      if (!email) {
        return res.status(400).json({
          ok: false,
          error: "Email requis.",
        });
      }

      const result = await sql`
          SELECT
            ${sql.unsafe(ticketColumns())}
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
    ===================================================== */

    if (route.startsWith("tickets/phone/") && req.method === "GET") {
      const phone = normalizePhone(
        decodeURIComponent(route.substring("tickets/phone/".length)),
      );

      if (!phone) {
        return res.status(400).json({
          ok: false,
          error: "Téléphone requis.",
        });
      }

      const result = await sql`
          SELECT
            ${sql.unsafe(ticketColumns())}
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
    ===================================================== */

    if (route.startsWith("tickets/") && req.method === "DELETE") {
      const suffix = route.substring("tickets/".length);

      if (suffix && !suffix.includes("/")) {
        const ticketNumber = decodeURIComponent(suffix).trim();

        const result = await sql`
            DELETE FROM "Ticket"
            WHERE
              "ticketNumber" =
                ${ticketNumber}
            RETURNING
              ${sql.unsafe(ticketColumns())}
          `;

        const ticket = result[0];

        if (!ticket) {
          return res.status(404).json({
            ok: false,
            error: "Billet introuvable.",
          });
        }

        return res.status(200).json({
          ok: true,
          message: "Billet supprimé avec succès.",
          ticket,
        });
      }
    }

    /* =====================================================
       GET ALL TICKETS
    ===================================================== */

    if (route === "tickets" && req.method === "GET") {
      const result = await sql`
          SELECT
            ${sql.unsafe(ticketColumns())}
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
    ===================================================== */

    if (route === "tickets" && req.method === "POST") {
      const firstName = String(req.body?.firstName ?? "").trim();

      const lastName = String(req.body?.lastName ?? "").trim();

      const participantName = String(req.body?.participantName ?? "").trim();

      const email = normalizeEmail(req.body?.email);

      const phone = normalizePhone(req.body?.phone);

      const reservationIdInput = String(req.body?.reservationId ?? "").trim();

      const eventId = String(req.body?.eventId ?? "").trim();

      const eventTitle = String(req.body?.eventTitle ?? "").trim();

      const dateLabel = String(req.body?.dateLabel ?? "").trim();

      const time = String(req.body?.time ?? "").trim();

      const durationRaw = String(req.body?.duration ?? "").trim();

      const venue = String(req.body?.venue ?? "").trim();

      const city = String(req.body?.city ?? "").trim();

      const quantity = calculateQuantity(req.body?.quantity);

      const childrenUnder12 = calculateChildren(req.body?.childrenUnder12);

      const children12Plus = calculateChildren(req.body?.children12Plus);

      const calculatedMinimumQuantity = Math.max(1, 1 + children12Plus);

      const finalQuantity = Math.max(quantity, calculatedMinimumQuantity);

      const duration = durationRaw || null;

      const finalParticipantName =
        participantName || `${firstName} ${lastName}`.trim();

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      if (!finalParticipantName) {
        return res.status(400).json({
          ok: false,
          error: "Nom du participant requis.",
        });
      }

      if (!email) {
        return res.status(400).json({
          ok: false,
          error: "Email requis.",
        });
      }

      if (!phone) {
        return res.status(400).json({
          ok: false,
          error: "Numéro de téléphone requis.",
        });
      }

      if (!eventTitle) {
        return res.status(400).json({
          ok: false,
          error: "Nom de l'événement requis.",
        });
      }

      if (!dateLabel) {
        return res.status(400).json({
          ok: false,
          error: "Date de l'événement requise.",
        });
      }

      if (!time) {
        return res.status(400).json({
          ok: false,
          error: "Heure de l'événement requise.",
        });
      }

      if (!venue) {
        return res.status(400).json({
          ok: false,
          error: "Lieu de l'événement requis.",
        });
      }

      if (!city) {
        return res.status(400).json({
          ok: false,
          error: "Ville de l'événement requise.",
        });
      }

      /* ---------------------------------------------------
         CAPACITÉ
      --------------------------------------------------- */

      const stats = await getStats(sql);
      const settings = await getSettings(sql);

      const capacity = Number(settings?.capacity ?? DEFAULT_TICKET_CAPACITY);

      if (stats.reserved + finalQuantity > capacity) {
        return res.status(409).json({
          ok: false,
          error: "La capacité maximale de l'événement est atteinte.",
          capacity,
          reserved: stats.reserved,
          remaining: Math.max(0, capacity - stats.reserved),
        });
      }

      if (!settings?.registrationsOpen) {
        return res.status(403).json({
          ok: false,
          error: "Les inscriptions sont actuellement fermées.",
        });
      }
      /* ---------------------------------------------------
         DOUBLON EMAIL
      --------------------------------------------------- */

      const existingEmail = await sql`
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

      if (existingEmail.length > 0) {
        return res.status(409).json({
          ok: false,
          error: "Une réservation existe déjà pour cette adresse email.",
          ticket: existingEmail[0],
        });
      }

      /* ---------------------------------------------------
         DOUBLON TÉLÉPHONE
      --------------------------------------------------- */

      const existingPhone = await sql`
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

      if (existingPhone.length > 0) {
        return res.status(409).json({
          ok: false,
          error: "Une réservation existe déjà pour ce numéro de téléphone.",
          ticket: existingPhone[0],
        });
      }

      /* ---------------------------------------------------
         RESERVATION ID
      --------------------------------------------------- */

      let reservationId = reservationIdInput || generateReservationId();

      let reservationExists = await sql`
          SELECT
            "id"
          FROM "Ticket"
          WHERE
            "reservationId" =
              ${reservationId}
          LIMIT 1
        `;

      if (reservationExists.length > 0) {
        reservationId = generateReservationId();

        reservationExists = await sql`
            SELECT
              "id"
            FROM "Ticket"
            WHERE
              "reservationId" =
                ${reservationId}
            LIMIT 1
          `;

        if (reservationExists.length > 0) {
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

      const id = generateId();

      const ticketNumber = generateTicketNumber();

      const verificationToken = generateVerificationToken();

      /* ---------------------------------------------------
         INSERT TICKET
      --------------------------------------------------- */

      const result = await sql`
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
            ${sql.unsafe(ticketColumns())}
        `;

      const ticket = result[0] as TicketRow | undefined;

      if (!ticket) {
        return res.status(500).json({
          ok: false,
          error: "Impossible de créer le billet.",
        });
      }

      // ---------------------------------------------------
      // NOTIFICATION : NOUVELLE RÉSERVATION
      // ---------------------------------------------------

      let notificationCreated = false;

      try {
        const notificationId = generateId("notif_");

        await sql`
    INSERT INTO "Notification" (
      "id",
      "type",
      "title",
      "message",
      "ticketId",
      "read",
      "createdAt"
    )
    VALUES (
      ${notificationId},
      'TICKET_CREATED',
      'Nouvelle réservation',
      ${`${ticket.participantName} vient de réserver le billet ${ticket.ticketNumber}.`},
      ${ticket.id},
      false,
      NOW()
    )
  `;

        notificationCreated = true;
      } catch (notificationError) {
        console.error("[SiloCamp Notification - Création]", notificationError);
      }

      return res.status(201).json({
        ok: true,
        message: "Réservation créée avec succès.",
        ticket,
        notificationCreated,
      });
    }

    /* =====================================================
       ROUTE INCONNUE
    ===================================================== */

    return res.status(404).json({
      ok: false,
      error: "Route API introuvable.",
      route,
    });
  } catch (error: any) {
    console.error("[SiloCamp API]", error);

    return res.status(500).json({
      ok: false,
      error: error?.message || "Erreur interne du serveur.",
    });
  }
}
