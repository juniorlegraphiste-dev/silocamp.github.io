import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createScanSession, getScanCookieName } from "./_session";

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

    if (!expectedLogin || !expectedPassword) {
      console.error(
        "[SiloCamp Auth] SCANNER_USERNAME ou SCANNER_PASSWORD manquant.",
      );

      return res.status(500).json({
        ok: false,
        authenticated: false,
        message:
          "Configuration du serveur d'authentification incomplète.",
      });
    }

    if (
      login !== expectedLogin ||
      password !== expectedPassword
    ) {
      return res.status(401).json({
        ok: false,
        authenticated: false,
        message: "Identifiant ou mot de passe incorrect.",
      });
    }

    const session = createScanSession(login);

    const isProduction =
      process.env.VERCEL_ENV === "production";

    const cookie = [
      `${getScanCookieName()}=${encodeURIComponent(session)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=28800",
      isProduction ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

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