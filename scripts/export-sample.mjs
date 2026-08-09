#!/usr/bin/env node
/**
 * Export one voluntary sample from D1 by id.
 * Usage: node scripts/export-sample.mjs <id>
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/export-sample.mjs <id>");
  process.exit(1);
}

const sql = `SELECT id, content_type, hex(bytes) AS hex_bytes FROM samples WHERE id = '${id.replace(/'/g, "")}' LIMIT 1;`;
const out = execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "matcha-filter-samples", "--remote", "--json", "--command", sql],
  { encoding: "utf8", cwd: resolve(import.meta.dirname, "..") },
);

const parsed = JSON.parse(out);
const rows = parsed?.[0]?.results || parsed?.results || [];
const row = rows[0];
if (!row?.hex_bytes) {
  console.error("Sample not found or empty:", id);
  process.exit(1);
}

const hex = String(row.hex_bytes);
const bytes = Buffer.from(hex, "hex");
const ext = String(row.content_type || "").includes("png")
  ? "png"
  : String(row.content_type || "").includes("webp")
    ? "webp"
    : "jpg";
const file = resolve(process.cwd(), `sample-${id}.${ext}`);
writeFileSync(file, bytes);
console.log(`Wrote ${file} (${bytes.length} bytes)`);
