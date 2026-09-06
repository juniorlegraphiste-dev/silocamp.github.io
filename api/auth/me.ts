import type { VercelRequest, VercelResponse } from "@vercel/node";

import { isScanAuthenticated } from "./_session";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      authenticated: false,
      message: "Méthode non autorisée.",
    });
  }

  try {
    const authenticated = isScanAuthenticated(req);

    if (!authenticated) {
      return res.status(401).json({
        authenticated: false,
      });
    }

    return res.status(200).json({
      authenticated: true,
    });
  } catch (error) {
    console.error("[SiloCamp Auth Me]", error);

    return res.status(401).json({
      authenticated: false,
    });
  }
}