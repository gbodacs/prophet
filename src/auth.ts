import crypto from "node:crypto";

import type { Request, Response } from "express";

const SESSION_COOKIE_NAME = "prophet_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret-in-production";

const BURNED_USERS: Array<{ username: string; password: string }> = [
  { username: "admin", password: "a" },
  { username: "operator", password: "o" }
];

const AUTH_USERS = BURNED_USERS.map((user) => ({
  username: user.username,
  passwordHash: hashPassword(user.password, user.username)
}));

function hashPassword(password: string, username: string): Buffer {
  return crypto.scryptSync(password, `prophet:${username}`, 32);
}

function getCookieValue(request: Request, cookieName: string): string | null {
  const rawCookie = request.headers.cookie;

  if (!rawCookie) {
    return null;
  }

  const cookies = rawCookie.split(";");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createSessionToken(username: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${username}.${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function parseSessionToken(token: string): { username: string } | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [username, expiresAtRaw, signature] = parts;
  const payload = `${username}.${expiresAtRaw}`;
  const expectedSignature = signPayload(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  if (!AUTH_USERS.some((user) => user.username === username)) {
    return null;
  }

  return { username };
}

export function validateCredentials(username: string, password: string): boolean {
  const user = AUTH_USERS.find((candidate) => candidate.username === username);

  if (!user) {
    return false;
  }

  const providedHash = hashPassword(password, username);

  if (providedHash.length !== user.passwordHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedHash, user.passwordHash);
}

export function getAuthenticatedUser(request: Request): { username: string } | null {
  const token = getCookieValue(request, SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return parseSessionToken(token);
}

export function setAuthCookie(response: Response, username: string): void {
  const token = createSessionToken(username);
  const secure = process.env.NODE_ENV === "production";

  response.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    maxAge: SESSION_TTL_MS,
    path: "/"
  });
}

export function clearAuthCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}
