import { v4 as uuidv4 } from "uuid";

import { readDb, writeDb } from "../lib/jsonDb";
import type { OperationRecord } from "../types/operation";

export async function listOperations(): Promise<OperationRecord[]> {
  const db = await readDb();
  return db.operations;
}

export async function addSuccessfulOperation(
  input: Omit<OperationRecord, "id" | "createdAt">
): Promise<OperationRecord> {
  const db = await readDb();

  const operation: OperationRecord = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...input
  };

  db.operations.push(operation);
  await writeDb(db);
  return operation;
}

export async function removeOperationById(id: string): Promise<OperationRecord | null> {
  const db = await readDb();
  const index = db.operations.findIndex((operation) => operation.id === id);

  if (index === -1) {
    return null;
  }

  const [removed] = db.operations.splice(index, 1);
  await writeDb(db);
  return removed;
}
