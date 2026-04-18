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
import {
  clearAuthCookie,
  getAuthenticatedUser,
  setAuthCookie,
  validateCredentials
} from "./auth";
import { ensureDbFile } from "./lib/jsonDb";
import operationsRouter from "./routes/operations.routes";
import { renderLoginPage } from "./views/loginPage";
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
app.use(express.urlencoded({ extended: false }));

app.use("/public/ui", express.static(path.join(PUBLIC_DIR, "ui")));

app.get("/login", (request, response) => {
  if (getAuthenticatedUser(request)) {
    response.redirect("/");
    return;
  }

  response.status(200).type("html").send(renderLoginPage());
});

app.post("/login", (request, response) => {
  const username = String(request.body.username || "").trim();
  const password = String(request.body.password || "");

  if (!validateCredentials(username, password)) {
    response.status(401).type("html").send(renderLoginPage({ errorMessage: "Hibás felhasználónév vagy jelszó." }));
    return;
  }

  setAuthCookie(response, username);
  response.redirect("/");
});

app.post("/logout", (_request, response) => {
  clearAuthCookie(response);
  response.redirect("/login");
});

const requireAuth: express.RequestHandler = (request, response, next) => {
  if (!getAuthenticatedUser(request)) {
    const acceptsJson = (request.headers.accept || "").includes("application/json");

    if (request.originalUrl.startsWith("/api") || acceptsJson) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    response.redirect("/login");
    return;
  }

  next();
};

app.use("/public/results", requireAuth, express.static(RESULTS_DIR));
app.use("/api", requireAuth, operationsRouter);

app.get("/", (request, response) => {
  if (!getAuthenticatedUser(request)) {
    response.redirect("/login");
    return;
  }

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
