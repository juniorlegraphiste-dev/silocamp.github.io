import "dotenv/config";

import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "SiloCamp API",
    timestamp: new Date().toISOString(),
  });
});

export default app;