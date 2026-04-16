import fs from "node:fs/promises";

import express from "express";
import multer from "multer";

import { MAX_CSV_SIZE_BYTES } from "../config";
import {
  addSuccessfulOperation,
  listOperations,
  removeOperationById
} from "../services/operations.service";
import { processUploadedCsv } from "../services/processor.service";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CSV_SIZE_BYTES
  },
  fileFilter: (_request, file, callback) => {
    const isCsvExt = file.originalname.toLowerCase().endsWith(".csv");
    const allowedMimeTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain"
    ];
    const isCsvMime = allowedMimeTypes.includes(file.mimetype);

    if (!isCsvExt || !isCsvMime) {
      callback(new Error("Only CSV files are allowed"));
      return;
    }

    callback(null, true);
  }
});

router.post("/upload", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "CSV file is required in field 'file'" });
      return;
    }

    const result = await processUploadedCsv(request.file);

    if (!result.ok) {
      response.status(result.status).json({ error: result.message, detail: result.detail });
      return;
    }

    const operation = await addSuccessfulOperation({
      baseName: result.baseName,
      token: result.token,
      csvFileName: result.csvFileName,
      csvPath: result.csvPath,
      pngFileNames: result.pngFileNames,
      pngPaths: result.pngPaths
    });

    response.status(201).json({
      message: "File processed successfully",
      operation
    });
  } catch (error) {
    next(error);
  }
});

router.get("/operations", async (_request, response, next) => {
  try {
    const operations = await listOperations();
    response.status(200).json({ operations });
  } catch (error) {
    next(error);
  }
});

router.delete("/operations/:id", async (request, response, next) => {
  try {
    const removed = await removeOperationById(request.params.id);

    if (!removed) {
      response.status(404).json({ error: "Operation not found" });
      return;
    }

    const targets = [removed.csvPath, ...removed.pngPaths];
    const deleted: string[] = [];
    const missing: string[] = [];
    const failed: Array<{ path: string; reason: string }> = [];

    await Promise.all(
      targets.map(async (target) => {
        try {
          await fs.rm(target, { force: false });
          deleted.push(target);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            missing.push(target);
            return;
          }

          failed.push({
            path: target,
            reason: (error as Error).message
          });
        }
      })
    );

    response.status(200).json({
      message: "Operation deleted from database with best-effort file cleanup",
      cleanup: {
        deleted,
        missing,
        failed
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
