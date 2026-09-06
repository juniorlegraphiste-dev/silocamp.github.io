import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  createScanSession,
  createSessionCookie,
  validateScanCredentials,
} from "./_session";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Méthode non autorisée.",
    });
  }

  try {
    const { login, password } = req.body || {};

    if (
      typeof login !== "string" ||
      typeof password !== "string" ||
      !login.trim() ||
      !password
    ) {
      return res.status(400).json({
        ok: false,
        message: "Identifiant et mot de passe requis.",
      });
    }

    const authenticated = validateScanCredentials(
      login.trim(),
      password,
    );

    if (!authenticated) {
      return res.status(401).json({
        ok: false,
        message: "Identifiant ou mot de passe incorrect.",
      });
    }

    const session = createScanSession();

    res.setHeader(
      "Set-Cookie",
      createSessionCookie(session),
    );

    return res.status(200).json({
      ok: true,
      message: "Authentification réussie.",
    });
  } catch (error) {
    console.error("[SiloCamp Auth Login]", error);

    return res.status(500).json({
      ok: false,
      message: "Service d'authentification indisponible.",
    });
  }
}