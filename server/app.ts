import "dotenv/config";

import express from "express";
import cors from "cors";

import ticketsRouter from "./routes/tickets";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    service: "SiloCamp API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/tickets", ticketsRouter);

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
});

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