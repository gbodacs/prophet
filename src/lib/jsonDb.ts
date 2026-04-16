import fs from "node:fs/promises";
import path from "node:path";

import { DB_PATH } from "../config";
import type { OperationsDb } from "../types/operation";

const EMPTY_DB: OperationsDb = { operations: [] };

export async function ensureDbFile(): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await writeDb(EMPTY_DB);
  }
}

export async function readDb(): Promise<OperationsDb> {
  const raw = await fs.readFile(DB_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<OperationsDb>;

  if (!parsed || !Array.isArray(parsed.operations)) {
    throw new Error("Invalid operations database format");
  }

  return { operations: parsed.operations };
}

export async function writeDb(db: OperationsDb): Promise<void> {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempPath, DB_PATH);
}
