import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  createScanSession,
  getScanCookieName,
} from "./_session";

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

    const expectedLogin =
      process.env.SCANNER_USERNAME?.trim();

    const expectedPassword =
      process.env.SCANNER_PASSWORD;

    const sessionSecret =
      process.env.SCANNER_SESSION_SECRET;

    // Vérification complète de la configuration
    if (!expectedLogin) {
      console.error(
        "[SiloCamp Auth] SCANNER_USERNAME manquant.",
      );

      return res.status(500).json({
        ok: false,
        authenticated: false,
        message:
          "Configuration serveur : SCANNER_USERNAME manquant.",
      });
    }

    if (!expectedPassword) {
      console.error(
        "[SiloCamp Auth] SCANNER_PASSWORD manquant.",
      );

      return res.status(500).json({
        ok: false,
        authenticated: false,
        message:
          "Configuration serveur : SCANNER_PASSWORD manquant.",
      });
    }

    if (!sessionSecret) {
      console.error(
        "[SiloCamp Auth] SCANNER_SESSION_SECRET manquant.",
      );

      return res.status(500).json({
        ok: false,
        authenticated: false,
        message:
          "Configuration serveur : SCANNER_SESSION_SECRET manquant.",
      });
    }

    // Vérification des identifiants
    if (
      login !== expectedLogin ||
      password !== expectedPassword
    ) {
      return res.status(401).json({
        ok: false,
        authenticated: false,
        message:
          "Identifiant ou mot de passe incorrect.",
      });
    }

    // Création de la session sécurisée
    const session = createScanSession(login);

    const isProduction =
      process.env.VERCEL_ENV === "production";

    const cookieParts = [
      `${getScanCookieName()}=${encodeURIComponent(session)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=28800",
    ];

    if (isProduction) {
      cookieParts.push("Secure");
    }

    res.setHeader(
      "Set-Cookie",
      cookieParts.join("; "),
    );

    return res.status(200).json({
      ok: true,
      authenticated: true,
      message: "Authentification réussie.",
    });
  } catch (error) {
    console.error(
      "[SiloCamp Auth Login] ERREUR COMPLÈTE:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue du serveur.";

    return res.status(500).json({
      ok: false,
      authenticated: false,
      message: `Erreur serveur : ${message}`,
    });
  }
}