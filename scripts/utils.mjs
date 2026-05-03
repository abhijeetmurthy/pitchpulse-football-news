import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..");

export async function readJson(relativePath, fallback = []) {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const raw = await fs.readFile(fullPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJson(relativePath, data) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
}

export function summarize(text = "", maxLen = 220) {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  return cleaned.length <= maxLen ? cleaned : `${cleaned.slice(0, maxLen - 1)}...`;
}
