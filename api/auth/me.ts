import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const COOKIE_NAME = "silocamp_scan_session";

function getSession(
  req: VercelRequest,
): { username: string; exp: number } | null {
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

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
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
    console.error("[SiloCamp Auth Me]", error);
    return null;
  }
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      authenticated: false,
      message: "Méthode non autorisée.",
    });
  }

  const session = getSession(req);

  if (!session) {
    return res.status(401).json({
      ok: true,
      authenticated: false,
    });
  }

  return res.status(200).json({
    ok: true,
    authenticated: true,
    username: session.username,
  });
}