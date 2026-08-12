#!/usr/bin/env node
/**
 * Notify IndexNow (Bing + participating engines) that site URLs changed.
 * Requires the key file at https://matchafilter.online/{KEY}.txt
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "matchafilter.online";
const KEY = "bd112d167f674d0f9200bd2b0516bf24";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function urlsFromSitemap() {
  const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  return [...new Set(locs)];
}

async function waitForKeyFile(attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(KEY_LOCATION, { cache: "no-store" });
      const text = (await res.text()).trim();
      if (res.ok && text === KEY) return;
      console.warn(`Key file not ready (${res.status}), retry ${i + 1}/${attempts}…`);
    } catch (err) {
      console.warn(`Key file fetch failed, retry ${i + 1}/${attempts}…`, err);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`IndexNow key file not reachable at ${KEY_LOCATION}`);
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : urlsFromSitemap();
if (urls.length === 0) {
  console.error("No URLs to submit");
  process.exit(1);
}

await waitForKeyFile();

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log(`IndexNow ${res.status} — submitted ${urls.length} URL(s)`);
if (text) console.log(text);
for (const u of urls) console.log(`  ${u}`);

// 200 OK, 202 Accepted (key validation pending) are success.
if (res.status !== 200 && res.status !== 202) process.exit(1);
