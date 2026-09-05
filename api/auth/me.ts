import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getScanSession } from "./_session";

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

  try {
    const session = getScanSession(req);

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
  } catch (error) {
    console.error(
      "[SiloCamp Auth Me]",
      error,
    );

    return res.status(500).json({
      ok: false,
      authenticated: false,
      message:
        "Impossible de vérifier la session.",
    });
  }
}