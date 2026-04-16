import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import {
  RESULTS_DIR,
  ROOT_DIR,
  UPLOAD_DIR,
  PYTHON_SCRIPT_PATH
} from "../config";

export interface ProcessResult {
  success: boolean;
  errorMessage?: string;
  stderr?: string;
}

function sanitizeBaseName(name: string): string {
  const onlyName = path.parse(name).name;
  const sanitized = onlyName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return sanitized || "file";
}

function formatToken(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
}

function runPythonCommand(command: "python" | "python3", csvFileName: string): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, [PYTHON_SCRIPT_PATH, csvFileName], { cwd: ROOT_DIR });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({ success: false, errorMessage: error.message });
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
        return;
      }

      resolve({
        success: false,
        errorMessage: `${command} process exited with code ${code}`,
        stderr: stderr.trim() || undefined
      });
    });
  });
}

async function runPythonProcessor(csvFileName: string): Promise<ProcessResult> {
  const pythonResult = await runPythonCommand("python", csvFileName);
  if (pythonResult.success) {
    return pythonResult;
  }

  const missingPython = pythonResult.errorMessage?.includes("ENOENT") ?? false;
  if (!missingPython) {
    return pythonResult;
  }

  return runPythonCommand("python3", csvFileName);
}

export async function processUploadedCsv(file: Express.Multer.File): Promise<
  | {
      ok: true;
      baseName: string;
      token: string;
      csvFileName: string;
      csvPath: string;
      pngFileNames: string[];
      pngPaths: string[];
    }
  | { ok: false; status: number; message: string; detail?: string }
> {
  const baseName = sanitizeBaseName(file.originalname);
  const token = formatToken(new Date());
  const csvFileName = `${baseName}-${token}.csv`;
  const csvPath = path.join(UPLOAD_DIR, csvFileName);

  await fs.writeFile(csvPath, file.buffer);

  const processorResult = await runPythonProcessor(csvFileName);
  if (!processorResult.success) {
    await fs.rm(csvPath, { force: true });
    return {
      ok: false,
      status: 500,
      message: "Python processing failed",
      detail: processorResult.stderr || processorResult.errorMessage
    };
  }

  const pngFileNames = [1, 2, 3].map((index) => `${baseName}${index}-${token}.png`);
  const pngPaths = pngFileNames.map((name) => path.join(RESULTS_DIR, name));

  const checks = await Promise.all(
    pngPaths.map(async (pngPath) => {
      try {
        await fs.access(pngPath);
        return true;
      } catch {
        return false;
      }
    })
  );

  const allExist = checks.every(Boolean);

  if (!allExist) {
    await fs.rm(csvPath, { force: true });
    await Promise.all(pngPaths.map((pngPath) => fs.rm(pngPath, { force: true })));
    return {
      ok: false,
      status: 500,
      message: "Processing completed but expected PNG files were not found"
    };
  }

  return {
    ok: true,
    baseName,
    token,
    csvFileName,
    csvPath,
    pngFileNames,
    pngPaths
  };
}
