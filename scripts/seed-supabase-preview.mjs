import {
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  unlinkSync,
  mkdirSync,
} from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { catalog, categories, homeCopy } from "./preview-content/catalog.mjs";
const root = resolve(import.meta.dirname, "..");
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
const canonical = (value) =>
  value && typeof value === "object"
    ? Array.isArray(value)
      ? value.map(canonical)
      : Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, canonical(value[k])]),
        )
    : value;
const hash = (value) =>
  createHash("sha256")
    .update(
      typeof value === "string" ? value : JSON.stringify(canonical(value)),
    )
    .digest("hex");
const target = new URL(
  env.DATABASE_URL?.replace(/^jdbc:/, "") || "https://invalid",
);
if (
  process.env.ALLOW_SUPABASE_PREVIEW_SEED !== "true" ||
  env.SPRING_PROFILES_ACTIVE !== "dev"
)
  throw new Error(
    "Explicit ALLOW_SUPABASE_PREVIEW_SEED=true and development profile required.",
  );
if (
  target.hostname !== "aws-0-ap-northeast-2.pooler.supabase.com" ||
  target.port !== "5432" ||
  target.pathname !== "/postgres" ||
  target.searchParams.get("sslmode") !== "require" ||
  env.DATABASE_USERNAME !== "postgres.qhpdjefulinrwbcwqxfi"
)
  throw new Error("Refusing an unreviewed database target.");
const base = "http://127.0.0.1:8080/api/v1";
const statePath = resolve(root, ".local/supabase-preview-seed-state.json");
const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, "utf8"))
  : {
      version: 1,
      targetFingerprint: hash(env.DATABASE_URL + "\n" + env.DATABASE_USERNAME),
      entries: {},
      media: {},
      sections: {},
    };
if (
  state.targetFingerprint !==
  hash(env.DATABASE_URL + "\n" + env.DATABASE_USERNAME)
)
  throw new Error("Seed state belongs to a different target.");
function persist() {
  mkdirSync(resolve(root, ".local"), { recursive: true });
  const tmp = statePath + ".tmp";
  writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  renameSync(tmp, statePath);
}
const cookies = new Map();
let token = "";
let csrf = "";
async function request(path, body, method = "GET") {
  const headers = {
    Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(base + path, {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });
  for (const value of response.headers.getSetCookie()) {
    const pair = value.split(";")[0];
    const n = pair.indexOf("=");
    cookies.set(pair.slice(0, n), pair.slice(n + 1));
  }
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok)
    throw new Error(
      `API ${response.status} on ${path.split("?")[0]}. No response body was logged.`,
    );
  return data;
}
async function all(resource) {
  const items = [];
  for (let page = 0; ; page++) {
    const result = await request(
      `/admin/${resource}?locale=vi&size=50&page=${page}`,
    );
    items.push(...result.items);
    if (items.length >= result.total) return items;
  }
}
function editable(item) {
  return Object.fromEntries(
    [
      "locale",
      "title",
      "slug",
      "excerpt",
      "content",
      "seoTitle",
      "seoDescription",
      "featuredMediaId",
      "featured",
      "metadata",
      "categoryIds",
    ].map((key) => [key, item[key]]),
  );
}
const stock = {
  sewing: [
    "5830692",
    "Ảnh minh họa thao tác may; ảnh stock, không phải nhà máy HUGAMEX",
  ],
  textile: [
    "12362544",
    "Ảnh minh họa chất liệu; ảnh stock, không phải tư liệu HUGAMEX",
  ],
  jacket: [
    "jacket",
    "Ảnh stock minh họa áo khoác; không phải sản phẩm HUGAMEX",
  ],
  sportswear: [
    "sportswear",
    "Ảnh stock minh họa áo thể thao; không phải sản phẩm HUGAMEX",
  ],
  trousers: [
    "trousers",
    "Ảnh stock minh họa quần; không phải sản phẩm HUGAMEX",
  ],
};
const garmentUrls = {
  jacket:
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85&fm=jpg",
  sportswear:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85&fm=jpg",
  trousers:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85&fm=jpg",
};
async function photo(key) {
  if (state.media[key]) {
    await request(`/admin/media?search=stock-${stock[key][0]}&size=12`);
    return state.media[key];
  }
  const [id, alt] = stock[key];
  const response = await fetch(
    garmentUrls[key] ||
      `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`,
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error("Stock image unavailable.");
  const data = await response.arrayBuffer();
  if (data.byteLength > 5 * 1024 * 1024)
    throw new Error("Stock image exceeds media limit.");
  const form = new FormData();
  form.append(
    "file",
    new Blob([data], { type: "image/jpeg" }),
    `stock-${id}.jpg`,
  );
  form.append("altText", alt);
  form.append("isPublic", "true");
  state.media[key] = (await request("/admin/media", form, "POST")).id;
  persist();
  return state.media[key];
}
const existing = {};
const results = {};
const skipped = [];
async function upsert(spec) {
  const stable = `${spec.resource}/${spec.key}`;
  if (!existing[spec.resource])
    existing[spec.resource] = await all(spec.resource);
  let saved = state.entries[stable];
  const collision = existing[spec.resource].find(
    (item) =>
      item.canonicalSlug === spec.key ||
      (item.metadata.routeKey === spec.metadata.routeKey &&
        spec.metadata.routeKey),
  );
  if (!saved && collision) {
    skipped.push(stable);
    console.log(`Preserved existing owner content: ${stable}`);
    return collision.id;
  }
  let id = saved?.id;
  const image = spec.image ? await photo(spec.image) : null;
  const payloads = Object.fromEntries(
    Object.entries(spec.translations).map(([locale, copy]) => [
      locale,
      {
        locale,
        ...copy,
        slug: locale === "vi" ? spec.key : `${spec.key}-en`,
        seoTitle: copy.title.replace(/\n/g, " "),
        seoDescription: copy.excerpt,
        featuredMediaId: image,
        featured: spec.resource === "hero-slides",
        metadata: spec.metadata,
        categoryIds: spec.category
          ? [results[`categories/${spec.category}`]]
          : [],
      },
    ]),
  );
  // Inspect both translations before any write; shared metadata/media/status must also match.
  if (saved) {
    for (const locale of ["vi", "en"]) {
      const current = await request(
        `/admin/${spec.resource}/${id}?locale=${locale}`,
      );
      if (
        saved.fingerprints[locale] &&
        (hash(editable(current)) !== saved.fingerprints[locale] ||
          current.status !== saved.status)
      ) {
        skipped.push(stable);
        console.log(`Preserved edited content: ${stable}`);
        return id;
      }
    }
  }
  if (saved && hash(payloads) === saved.payloadHash) return id;
  for (const locale of ["vi", "en"]) {
    const result = await request(
      `/admin/${spec.resource}${id ? "/" + id : ""}`,
      payloads[locale],
      id ? "PUT" : "POST",
    );
    id = result.id;
    state.entries[stable] = {
      ...state.entries[stable],
      id,
      fingerprints: {
        ...state.entries[stable]?.fingerprints,
        [locale]: hash(editable(result)),
      },
      status: result.status,
    };
    persist();
  }
  await request(
    `/admin/${spec.resource}/${id}/status`,
    { status: "PUBLISHED" },
    "PATCH",
  );
  const fingerprints = {};
  for (const locale of ["vi", "en"])
    fingerprints[locale] = hash(
      editable(await request(`/admin/${spec.resource}/${id}?locale=${locale}`)),
    );
  state.entries[stable] = {
    id,
    fingerprints,
    status: "PUBLISHED",
    payloadHash: hash(payloads),
  };
  persist();
  console.log(`Published preview: ${stable}`);
  return id;
}
try {
  const credentials = JSON.parse(
    readFileSync(resolve(root, ".local/supabase-admin.json"), "utf8"),
  );
  csrf = (await request("/auth/csrf")).token;
  token = (
    await request(
      "/auth/login",
      { email: credentials.email, password: credentials.password },
      "POST",
    )
  ).accessToken;
  const me = await request("/auth/me");
  if (process.argv.includes("--check")) {
    console.log(
      JSON.stringify({
        mfaEnabled: me.mfaEnabled,
        privileged: me.roles.some((role) =>
          ["ADMIN", "SUPER_ADMIN"].includes(role),
        ),
      }),
    );
  } else {
    if (!me.mfaEnabled)
      throw new Error(
        "Owner must finish Authenticator setup on the admin website first. No security settings were changed.",
      );
    const codePath = resolve(root, ".local/seed-mfa-code.txt");
    if (process.argv.includes("--wait-mfa")) {
      console.log("Waiting for a fresh TOTP in the local private file.");
      const deadline = Date.now() + 300000;
      while (
        (!existsSync(codePath) || !readFileSync(codePath, "utf8").trim()) &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!existsSync(codePath) || !readFileSync(codePath, "utf8").trim())
      throw new Error(
        "Enter a current TOTP locally in .local/seed-mfa-code.txt, then run again. Do not send the code through chat.",
      );
    const code = readFileSync(codePath, "utf8").trim();
    unlinkSync(codePath);
    if (!/^\d{6}$/.test(code))
      throw new Error("The local MFA file must contain six digits.");
    await request("/auth/mfa/verify", { code }, "POST");
    const handshake = await request("/admin/preview-seed-target");
    if (
      handshake.profile !== "dev" ||
      handshake.targetFingerprint !== state.targetFingerprint
    )
      throw new Error(
        "Running backend target does not match reviewed local configuration.",
      );
    for (const [key, vi, en] of categories)
      results[`categories/${key}`] = await upsert({
        resource: "categories",
        key,
        metadata: {},
        image: null,
        translations: {
          vi: { title: vi, excerpt: vi, content: { type: "doc", content: [] } },
          en: { title: en, excerpt: en, content: { type: "doc", content: [] } },
        },
      });
    for (const spec of catalog)
      results[`${spec.resource}/${spec.key}`] = await upsert(spec);
    const refs = {
      about: [results["pages/gioi-thieu"]],
      manufacturing: [results["pages/nang-luc-san-xuat"]],
      products: catalog
        .filter((s) => s.resource === "products")
        .map((s) => results[`products/${s.key}`]),
      branches: catalog
        .filter((s) => s.resource === "branches")
        .map((s) => results[`branches/${s.key}`]),
      quality: [results["certifications/ho-so-chat-luong"]],
      partners: [results["partners/hop-tac-may-mac"]],
      news: catalog
        .filter((s) => s.resource === "posts")
        .slice(0, 3)
        .map((s) => results[`posts/${s.key}`]),
    };
    const sections = await request("/admin/homepage");
    for (const [index, section] of sections.entries()) {
      const previous = state.sections[section.key];
      if (previous && hash(section) !== previous.fingerprint) {
        console.log(`Preserved edited section: ${section.key}`);
        continue;
      }
      if (
        !previous &&
        (section.contentIds.length || section.headlineVi || section.headlineEn)
      ) {
        console.log(`Preserved existing section: ${section.key}`);
        continue;
      }
      const copy = homeCopy[section.key];
      if (!copy) continue;
      const next = {
        ...section,
        enabled: true,
        position: index,
        headlineVi: copy[0],
        headlineEn: copy[1],
        subheadlineVi: copy[2],
        subheadlineEn: copy[3],
        contentIds: refs[section.key] || [],
      };
      if (previous && hash(next) === previous.fingerprint) continue;
      await request(`/admin/homepage/${section.id}`, next, "PUT");
      state.sections[section.key] = { fingerprint: hash(next) };
      persist();
    }
    const counts = {};
    for (const resource of [
      "pages",
      "posts",
      "products",
      "categories",
      "hero-slides",
      "branches",
      "partners",
      "certifications",
    ])
      counts[resource] = (await all(resource)).filter(
        (item) => item.status === "PUBLISHED",
      ).length;
    console.log(
      JSON.stringify({
        publishedCounts: counts,
        ownerEditsPreserved: skipped.length,
      }),
    );
    console.log("Checking idempotency without replacing owner edits.");
    for (const spec of catalog) await upsert(spec);
    if (process.argv.includes("--qa")) {
      const { capturePreviewQa } = await import("./preview-content/qa.mjs");
      await capturePreviewQa(cookies);
    }
  }
} finally {
  if (token) {
    csrf = (await request("/auth/csrf")).token;
    await request("/auth/logout", {}, "POST");
  }
  token = "";
  cookies.clear();
}
