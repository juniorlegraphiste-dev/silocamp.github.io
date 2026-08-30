import "dotenv/config";

import express from "express";
import cors from "cors";

import ticketsRouter from "./routes/tickets";

const app = express();

/**
 * CORS
 */
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

/**
 * JSON
 */
app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    service: "SiloCamp API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * TICKETS API
 */
app.use("/api/tickets", ticketsRouter);

/**
 * ROUTE INEXISTANTE
 */
app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
});

/**
 * ERREUR SERVEUR
 */
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[SiloCamp API]", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  },
);

export default app;