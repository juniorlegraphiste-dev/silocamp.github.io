import "dotenv/config";

import express from "express";
import cors from "cors";

import ticketsRouter from "./routes/tickets";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "SiloCamp API",
    status: "ok",
  });
});

app.use("/api/tickets", ticketsRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route API introuvable.",
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

    res.status(500).json({
      message: "Erreur interne du serveur.",
    });
  },
);

app.listen(PORT, () => {
  console.log(
    `SiloCamp API démarrée sur http://localhost:${PORT}`,
  );
});