// Uses the existing Docker QA fixture and MAIL_MODE=file. Never touches Supabase users/MFA.
import { readFileSync, writeFileSync, openSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { capturePreviewQa } from "./qa.mjs";
const root = resolve(import.meta.dirname, "../..");
const parse = (path) =>
  Object.fromEntries(
    readFileSync(path, "utf8")
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
const env = parse(resolve(root, "backend/.env"));
const dockerEnv = parse(resolve(root, ".env"));
const fixture = JSON.parse(
  readFileSync(resolve(root, ".local/e2e.json"), "utf8"),
);
const children = [];
const files = [];
function cleanEnvironment(variables) {
  const result = { ...globalThis.process.env, ...variables };
  delete result.DEBUG;
  return result;
}
function child(command, args, cwd, variables, label) {
  const log = openSync(
    resolve(root, `.local-phase2-qa-${label}.log`),
    "w",
    0o600,
  );
  files.push(log);
  const process = spawn(command, args, {
    cwd,
    env: cleanEnvironment(variables),
    stdio: ["ignore", log, log],
  });
  children.push(process);
  return process;
}
async function ready(url) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Isolated QA server did not become ready.");
}
const base = "http://127.0.0.1:8082/api/v1";
const cookies = new Map();
let token = "",
  csrf = "";
async function request(path, body, method = "GET") {
  const headers = {
    Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const value of response.headers.getSetCookie()) {
    const pair = value.split(";")[0];
    const n = pair.indexOf("=");
    cookies.set(pair.slice(0, n), pair.slice(n + 1));
  }
  if (!response.ok)
    throw new Error(`Isolated QA API ${response.status} on ${path}`);
  return response.json();
}
function otp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0,
    buffer = 0;
  const bytes = [];
  for (const c of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", Buffer.from(bytes))
    .update(counter)
    .digest();
  return String(
    (digest.readUInt32BE(digest[19] & 15) & 0x7fffffff) % 1000000,
  ).padStart(6, "0");
}
try {
  child(
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java",
    [
      "-jar",
      resolve(root, "backend/target/website-0.1.0.jar"),
      "--server.port=8082",
    ],
    resolve(root, "backend"),
    {
      ...env,
      DATABASE_URL: "jdbc:postgresql://127.0.0.1:5432/hugamex",
      DATABASE_USERNAME: "hugamex",
      DATABASE_PASSWORD: dockerEnv.POSTGRES_PASSWORD,
      MAIL_MODE: "file",
      CONTACT_NOTIFICATIONS_ENABLED: "true",
      CONTACT_NOTIFICATION_EMAIL: "qa-contact@example.invalid",
      SMTP_USERNAME: "",
      SMTP_PASSWORD: "",
      BOOTSTRAP_ADMIN_EMAIL: "",
      BOOTSTRAP_ADMIN_PASSWORD: "",
      ALLOW_SUPABASE_PREVIEW_SEED: "false",
      RUN_SUPABASE_PREVIEW_SEED_JOB: "false",
      CORS_ALLOWED_ORIGINS: "http://127.0.0.1:5176,http://127.0.0.1:5186",
      FRONTEND_URL: "http://127.0.0.1:5176",
    },
    "backend",
  );
  await ready(base + "/auth/config");
  for (const [port, mode] of [
    [5176, "public"],
    [5186, "admin"],
  ])
    child(
      "node",
      [
        "node_modules/vite/bin/vite.js",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--mode",
        mode,
      ],
      resolve(root, "frontend"),
      {
        HUGAMEX_QA_BACKEND: "http://127.0.0.1:8082",
        VITE_PUBLIC_URL: "http://127.0.0.1:5176",
        VITE_ADMIN_URL: "http://127.0.0.1:5186",
      },
      mode,
    );
  await ready("http://127.0.0.1:5186");
  csrf = (await request("/auth/csrf")).token;
  token = (
    await request(
      "/auth/login",
      { email: fixture.email, password: fixture.password },
      "POST",
    )
  ).accessToken;
  const me = await request("/auth/me");
  if (!me.mfaEnabled || !fixture.secret)
    throw new Error("Existing Docker QA MFA fixture is required.");
  await request("/auth/mfa/verify", { code: otp(fixture.secret) }, "POST");
  if (process.argv.includes("--e2e")) {
    fixture.recoveryCodes = (
      await request("/auth/mfa/recovery/regenerate", {}, "POST")
    ).recoveryCodes;
    writeFileSync(resolve(root, ".local/e2e.json"), JSON.stringify(fixture), {
      mode: 0o600,
    });
    writeFileSync(
      resolve(root, ".local/isolated-qa-target.json"),
      JSON.stringify({
        database: "jdbc:postgresql://127.0.0.1:5432/hugamex",
        mailMode: "file",
        backend: "http://127.0.0.1:8082",
      }),
      { mode: 0o600 },
    );
    const e2e = child(
      "node",
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config",
        "playwright.isolated.config.ts",
      ],
      resolve(root, "frontend"),
      {
        HUGAMEX_ISOLATED_QA: "true",
        PLAYWRIGHT_BROWSERS_PATH: resolve(root, ".tools/playwright"),
      },
      "e2e",
    );
    const code = await new Promise((resolve) => e2e.on("exit", resolve));
    if (code !== 0)
      throw new Error(
        "Isolated E2E tests failed. See the private local QA log.",
      );
    console.log(
      "Isolated E2E suite passed with Docker PostgreSQL and file-only mail.",
    );
  }
  await capturePreviewQa(cookies, {
    adminOnly: true,
    publicBase: "http://127.0.0.1:5176",
    adminBase: "http://127.0.0.1:5186",
  });
} finally {
  if (token) {
    try {
      csrf = (await request("/auth/csrf")).token;
      await request("/auth/logout", {}, "POST");
    } catch {}
  }
  for (const child of children) child.kill("SIGTERM");
  for (const file of files) closeSync(file);
  token = "";
  cookies.clear();
}
