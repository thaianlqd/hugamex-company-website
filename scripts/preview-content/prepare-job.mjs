import {
  catalog,
  categories,
  homeCopy,
  companySettings,
  retiredKeys,
} from "./catalog.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "../..");
if (process.env.ALLOW_SUPABASE_PREVIEW_SEED !== "true")
  throw new Error("Explicit preview seed flag required.");
const env = Object.fromEntries(
  readFileSync(resolve(root, "backend/.env"), "utf8")
    .split("\n")
    .filter((s) => /^[A-Z_]+=/.test(s))
    .map((s) => {
      const n = s.indexOf("=");
      return [
        s.slice(0, n),
        s
          .slice(n + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2"),
      ];
    }),
);
if (env.SPRING_PROFILES_ACTIVE !== "dev")
  throw new Error("Development profile required.");
const u = new URL(env.DATABASE_URL.replace(/^jdbc:/, ""));
if (
  u.hostname !== "aws-0-ap-northeast-2.pooler.supabase.com" ||
  u.port !== "5432" ||
  u.pathname !== "/postgres" ||
  u.searchParams.get("sslmode") !== "require" ||
  env.DATABASE_USERNAME !== "postgres.qhpdjefulinrwbcwqxfi"
)
  throw new Error("Unreviewed target.");
const owner = JSON.parse(
  readFileSync(resolve(root, ".local/supabase-admin.json"), "utf8"),
);
const photos = {
  5830692:
    "https://images.pexels.com/photos/5830692/pexels-photo-5830692.jpeg?auto=compress&cs=tinysrgb&w=1200",
  12362544:
    "https://images.pexels.com/photos/12362544/pexels-photo-12362544.jpeg?auto=compress&cs=tinysrgb&w=1200",
  jacket:
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85&fm=jpg",
  sportswear:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85&fm=jpg",
  trousers:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85&fm=jpg",
};
for (const [id, url] of Object.entries(photos)) {
  const response = await fetch(url);
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error("Stock photo unavailable.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 5 * 1024 * 1024) throw new Error("Image too large.");
  writeFileSync(resolve(root, `.local/preview-stock-${id}.jpg`), bytes, {
    mode: 0o600,
  });
}
const manifest = {
  version: 1,
  actorId: owner.id,
  targetFingerprint: createHash("sha256")
    .update(env.DATABASE_URL + "\n" + env.DATABASE_USERNAME)
    .digest("hex"),
  catalog,
  categories,
  homeCopy,
  settings: companySettings,
  retiredKeys,
};
writeFileSync(
  resolve(root, ".local/supabase-preview-catalog.json"),
  JSON.stringify(manifest),
  { mode: 0o600 },
);
console.log(
  "Prepared reviewed bilingual catalog and five illustrative images. No credentials included.",
);
