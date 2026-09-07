import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE_NAME = "silocamp_scan_session";

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

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  );

  return res.status(200).json({
    ok: true,
    authenticated: false,
    message: "Déconnexion réussie.",
  });
}