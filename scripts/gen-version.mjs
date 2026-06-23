#!/usr/bin/env node
// gen-version.mjs — 扫描 data/ 目录,对每个 JSON(除 version 自身)算 SHA-256 → 写 version.json
import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const DATA_DIR = new URL("../data/", import.meta.url).pathname; // returns /g/cj/data/ on Windows bash
// pathname 在 Win32 上可能形如 /g/cj/data/ — 直接用
// 但 import.meta.url 在 Windows 是 file:///g:/cj/scripts/gen-version.mjs, pathname 为 /g:/...
// 做兼容:如果 pathname 以 / 开头且有 : 则去掉前导 /
function resolveDataDir() {
  const u = new URL("../data/", import.meta.url);
  let p = u.pathname;
  // Windows Git Bash: pathname 形如 "/g:/cj/data/" — strip leading /
  if (/^\/[a-zA-Z]:/.test(p)) p = p.slice(1);
  return p;
}

const dataDir = resolveDataDir();
const VERSION_FILE = join(dataDir, "version.json");

async function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

const files = (await readdir(dataDir)).filter((f) => f.endsWith(".json") && f !== "version.json");

const now = new Date().toISOString();
const manifest = { schema: 1, generatedAt: now, files: {} };

for (const name of files) {
  const buf = await readFile(join(dataDir, name));
  const hash = await sha256(buf);
  manifest.files[name] = {
    version: now.slice(0, 16).replace("T", "."), // "2026-06-23.08:00"
    sha256: hash,
    bytes: buf.length,
  };
}

await writeFile(VERSION_FILE, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[gen-version] wrote version.json with ${Object.keys(manifest.files).length} files`);
