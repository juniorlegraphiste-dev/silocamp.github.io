import type { VercelRequest, VercelResponse } from "@vercel/node";

import { createLogoutCookie } from "./_session";

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

  res.setHeader("Set-Cookie", createLogoutCookie());

  return res.status(200).json({
    ok: true,
    message: "Déconnexion réussie.",
  });
}