import path from "node:path";

export const ROOT_DIR = process.cwd();
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const UPLOAD_DIR = path.join(PUBLIC_DIR, "upload");
export const RESULTS_DIR = path.join(PUBLIC_DIR, "results");
export const DB_PATH = path.join(ROOT_DIR, "data", "operations.json");
export const PYTHON_SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "predict.py");
export const PYTHON_DIS_CONFIG_PATH = path.join(path.dirname(PYTHON_SCRIPT_PATH), "config", "dis_config.json");
export const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;
