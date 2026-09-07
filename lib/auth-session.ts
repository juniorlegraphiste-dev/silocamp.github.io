import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

const COOKIE_NAME = "silocamp_scan_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

type SessionPayload = {
  username: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SCANNER_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SCANNER_SESSION_SECRET est introuvable dans les variables d'environnement.",
    );
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(
    value.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const header = req.headers.cookie;

  if (!header) {
    return {};
  }

  return header.split(";").reduce<Record<string, string>>(
    (cookies, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }

      return cookies;
    },
    {},
  );
}

export function createScanSession(username: string): string {
  const payload: SessionPayload = {
    username,
    exp: Date.now() + SESSION_DURATION,
  };

  const encodedPayload = base64UrlEncode(
    JSON.stringify(payload),
  );

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function getScanSession(
  req: VercelRequest,
): SessionPayload | null {
  try {
    const cookies = parseCookies(req);
    const session = cookies[COOKIE_NAME];

    if (!session) {
      return null;
    }

    const parts = session.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      return null;
    }

    const expectedSignature = sign(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return null;
    }

    const data = JSON.parse(
      base64UrlDecode(payload),
    ) as SessionPayload;

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

    return data;
  } catch (error) {
    console.error("[SiloCamp Session]", error);
    return null;
  }
}

export function isScanAuthenticated(
  req: VercelRequest,
): boolean {
  return getScanSession(req) !== null;
}

export function getScanCookieName(): string {
  return COOKIE_NAME;
}