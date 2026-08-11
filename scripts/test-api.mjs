/**
 * TalentLMS API diagnostic.
 * Usage:
 *   node scripts/test-api.mjs                     -> tests the API key (siteinfo)
 *   node scripts/test-api.mjs USERNAME PASSWORD   -> also tests userlogin
 */
import { readFileSync } from "node:fs";

// Load .env.local without extra deps
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const DOMAIN = env.TALENTLMS_DOMAIN;
const KEY = env.TALENTLMS_API_KEY;
const BASE = `https://${DOMAIN}.talentlms.com/api/v1`;
const auth = "Basic " + Buffer.from(`${KEY}:`).toString("base64");

console.log(`Domain : ${DOMAIN}.talentlms.com`);
console.log(`API key: ${KEY ? KEY.slice(0, 4) + "…" + KEY.slice(-4) : "(missing!)"}\n`);

async function call(name, path, form) {
  const res = await fetch(`${BASE}/${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: auth, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const text = await res.text();
  console.log(`[${name}] HTTP ${res.status}`);
  try {
    const j = JSON.parse(text);
    console.log(JSON.stringify(j, null, 2).slice(0, 800));
  } catch {
    console.log("(non-JSON response)", text.slice(0, 300));
  }
  console.log("");
  return res.status;
}

const s = await call("1. API key check — siteinfo", "siteinfo");
if (s === 401) {
  console.log("=> API key rejected. Re-copy it from TalentLMS: Account & Settings -> Basic settings -> API.");
} else if (s === 403) {
  console.log("=> API is not enabled on this portal. Enable it in Account & Settings -> Basic settings.");
} else if (s === 200) {
  console.log("=> API key is GOOD.");
  const [, , user, pass] = process.argv;
  if (user && pass) {
    const l = await call("2. userlogin", "userlogin", {
      login: user,
      password: pass,
      logout_redirect: Buffer.from(env.PORTAL_URL + "/").toString("base64"),
    });
    console.log(l === 200 ? "=> Login works end-to-end. The portal should work now." : "=> API key fine, but these credentials were rejected by TalentLMS.");
  } else {
    console.log("   Now run: node scripts/test-api.mjs YOUR_USERNAME YOUR_PASSWORD");
  }
}
