import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const COOKIE_NAME = "silocamp_scan_session";

function createSession(username: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      exp: Date.now() + 8 * 60 * 60 * 1000,
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

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      authenticated: false,
      message: "Méthode non autorisée.",
    });
  }

  try {
    const login = String(req.body?.login ?? "").trim();
    const password = String(req.body?.password ?? "");

    const expectedLogin = process.env.SCANNER_USERNAME;
    const expectedPassword = process.env.SCANNER_PASSWORD;
    const sessionSecret = process.env.SCANNER_SESSION_SECRET;

    if (!expectedLogin || !expectedPassword || !sessionSecret) {
      console.error("[SiloCamp Auth] Variables d'environnement manquantes.");

      return res.status(500).json({
        ok: false,
        authenticated: false,
        message: "Configuration du serveur d'authentification incomplète.",
      });
    }

    if (login !== expectedLogin || password !== expectedPassword) {
      return res.status(401).json({
        ok: false,
        authenticated: false,
        message: "Identifiant ou mot de passe incorrect.",
      });
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

    return res.status(200).json({
      ok: true,
      authenticated: true,
      message: "Authentification réussie.",
    });
  } catch (error) {
    console.error("[SiloCamp Auth Login]", error);

    return res.status(500).json({
      ok: false,
      authenticated: false,
      message: "Erreur du serveur d'authentification.",
    });
  }
}