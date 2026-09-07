import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getScanCookieName } from "../../lib/auth-session";

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Méthode non autorisée.",
    });
  }

  const isProduction =
    process.env.VERCEL_ENV === "production";

  const cookie = [
    `${getScanCookieName()}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);

  return res.status(200).json({
    ok: true,
    authenticated: false,
    message: "Déconnexion réussie.",
  });
}