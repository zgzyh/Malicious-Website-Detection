#!/usr/bin/env node
// fetch.mjs — 抓取 OpenPhish / URLhaus 社区源 → 清洗去重 → 写 blocklist.json
import { writeFile, readFile } from "node:fs/promises";

// ============ 配置 ============
const SOURCES = [
  {
    name: "openphish",
    url: "https://openphish.com/feed.txt",
    parse: (text) => {
      const hosts = [];
      for (const line of text.split("\n")) {
        const l = line.trim();
        if (!l || l.startsWith("#")) continue;
        try { hosts.push(new URL(l).hostname.toLowerCase()); } catch {}
      }
      return hosts;
    },
  },
  {
    name: "urlhaus",
    url: "https://urlhaus.abuse.ch/downloads/text/",
    // URLhaus text format: 每行 "host  url  status" tab 分隔,或纯文本列表
    parse: (text) => {
      const hosts = [];
      for (const line of text.split("\n")) {
        const l = line.trim();
        if (!l || l.startsWith("#")) continue;
        // 优先按 tab 分隔取第一列 host
        const parts = l.split("\t");
        if (parts.length > 1) hosts.push(parts[0].toLowerCase());
        else {
          try { hosts.push(new URL(parts[0]).hostname.toLowerCase()); } catch {}
        }
      }
      return hosts;
    },
  },
];

const DATA_DIR = new URL("../data/", import.meta.url);
const BLOCKLIST_FILE = new URL("blocklist.json", DATA_DIR);

// ============ 逻辑 ============
function today() {
  return new Date().toISOString().slice(0, 10);
}

console.log(`[fetch] start: ${new Date().toISOString()}`);

// 读取已有黑名单,保留人工追加的条目
let existing = { schema: 1, generatedAt: "", sources: [], entries: [] };
try {
  existing = JSON.parse(await readFile(BLOCKLIST_FILE, "utf-8"));
} catch {
  console.log("[fetch] no existing blocklist, starting fresh");
}

// 旧条目按 host 索引
const existingMap = new Map();
for (const e of existing.entries) {
  existingMap.set(e.host, e);
}

// 逐源抓取
for (const src of SOURCES) {
  try {
    console.log(`[fetch] fetching ${src.name}...`);
    const resp = await fetch(src.url, { signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) {
      console.error(`[fetch] ${src.name} HTTP ${resp.status}, skip`);
      continue;
    }
    const text = await resp.text();
    const hosts = src.parse(text);
    console.log(`[fetch] ${src.name}: ${hosts.length} hosts`);
    for (const host of hosts) {
      if (!existingMap.has(host)) {
        existingMap.set(host, { host, src: src.name, addedAt: today() });
      }
    }
  } catch (err) {
    console.error(`[fetch] ${src.name} error: ${err.message}, skip`);
  }
}

const entries = [...existingMap.values()].sort((a, b) => a.host.localeCompare(b.host));

const out = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  sources: SOURCES.map((s) => s.name),
  entries,
};

await writeFile(BLOCKLIST_FILE, JSON.stringify(out, null, 0) + "\n");
console.log(`[fetch] done: ${entries.length} entries → blocklist.json`);
