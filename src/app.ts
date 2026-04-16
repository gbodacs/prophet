import fs from "node:fs/promises";
import path from "node:path";

import express from "express";
import multer from "multer";

import {
  DB_PATH,
  PUBLIC_DIR,
  RESULTS_DIR,
  UPLOAD_DIR
} from "./config";
import { ensureDbFile } from "./lib/jsonDb";
import operationsRouter from "./routes/operations.routes";
import { renderMainPage } from "./views/mainPage";

export async function initializeStorage(): Promise<void> {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await ensureDbFile();
}

const app = express();

app.use(express.json());
app.use("/public", express.static(PUBLIC_DIR));
app.use("/api", operationsRouter);

app.get("/", (_request, response) => {
  response.status(200).type("html").send(renderMainPage());
});

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(400).json({ error: "File too large. Max size is 10 MB." });
    return;
  }

  if (error.message === "Only CSV files are allowed") {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Internal server error", detail: error.message });
});

export default app;
