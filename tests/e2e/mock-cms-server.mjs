import { createServer } from "node:http";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const fixturesDirectory = dirname(fileURLToPath(import.meta.url)) + "/fixtures";
const [cmsManifest, mediaManifest] = await Promise.all([
  readJson(join(fixturesDirectory, "cms.seed.json")),
  readJson(join(fixturesDirectory, "media.seed.json")),
]);
const assetsById = new Map(mediaManifest.assets.map((asset) => [asset.id, asset]));
const updatedAt = "2026-08-15T00:00:00.000Z";

function json(response, status, value) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

function collectAssetIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectAssetIds(entry, ids));
    return ids;
  }
  if (!value || typeof value !== "object") return ids;
  for (const [key, entry] of Object.entries(value)) {
    if (
      [
        "assetId",
        "desktopAssetId",
        "mobileAssetId",
        "posterDesktopAssetId",
        "posterMobileAssetId",
      ].includes(key) &&
      typeof entry === "string"
    ) {
      ids.add(entry);
    } else {
      collectAssetIds(entry, ids);
    }
  }
  return ids;
}

function publicAsset(asset) {
  return {
    id: asset.id,
    type: asset.type,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    url: asset.url,
    width: asset.width,
    height: asset.height,
    createdAt: updatedAt,
    updatedAt,
  };
}

function pageSummary(page) {
  const contactHero =
    page.category === "info" && page.slug === "contact"
      ? page.sections.find((section) => section.slug === "contact-hero")
      : undefined;
  const headerLabel = findTextItem(contactHero, "headerNavigationLabel");
  const footerLabel = findTextItem(contactHero, "footerNavigationLabel");
  return {
    id: page.id,
    slug: page.slug,
    titleAr: page.titleAr,
    titleEn: page.titleEn,
    category: page.category,
    template: page.template,
    navigationPlacement: page.navigationPlacement,
    navigationOrder: page.navigationOrder,
    headerNavigationLabelAr: headerLabel?.textAr ?? page.titleAr,
    headerNavigationLabelEn: headerLabel?.textEn ?? page.titleEn,
    footerNavigationLabelAr: footerLabel?.textAr ?? page.titleAr,
    footerNavigationLabelEn: footerLabel?.textEn ?? page.titleEn,
    isIndexable: page.isIndexable,
    updatedAt,
  };
}

function findTextItem(section, key) {
  for (const block of section?.content?.blocks ?? []) {
    const item = block.items.find(
      (candidate) => candidate.type === "text" && candidate.key === key
    );
    if (item) return item.text;
  }
  return undefined;
}

function publicPage(page) {
  const assetIds = collectAssetIds(page.sections.map((section) => section.content));
  if (page.seoImageAssetId) assetIds.add(page.seoImageAssetId);
  const pageAssets = {};
  for (const id of assetIds) {
    const asset = assetsById.get(id);
    if (asset) pageAssets[id] = publicAsset(asset);
  }
  return {
    ...page,
    sections: page.sections.map((section) => ({ ...section, updatedAt })),
    updatedAt,
    latestUpdatedAt: updatedAt,
    latestUpdateSource: "page",
    assetsById: pageAssets,
  };
}

async function serveAsset(pathname, request, response) {
  const asset = mediaManifest.assets.find((entry) => entry.url === pathname);
  if (!asset) {
    response.writeHead(404);
    response.end();
    return;
  }
  try {
    const body = await readFile(join(fixturesDirectory, "assets", basename(asset.bundlePath)));
    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) {
        response.writeHead(416, { "content-range": `bytes */${body.length}` });
        response.end();
        return;
      }
      const chunk = body.subarray(start, end + 1);
      response.writeHead(206, {
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
        "content-length": chunk.length,
        "content-range": `bytes ${start}-${end}/${body.length}`,
        "content-type": asset.mimeType,
      });
      response.end(chunk);
      return;
    }
    response.writeHead(200, {
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": body.length,
      "content-type": asset.mimeType,
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1:3100");
  if (url.pathname === "/health") return json(response, 200, { ok: true });
  if (url.pathname === "/api/contact-info") {
    const settings = cmsManifest.platformSettings;
    const logo = assetsById.get(settings.logoAssetId);
    return json(response, 200, { ...settings, logoUrl: logo?.url ?? null });
  }
  if (url.pathname === "/api/cms/pages") {
    return json(response, 200, cmsManifest.pages.filter((page) => page.isActive).map(pageSummary));
  }
  const pageMatch = url.pathname.match(/^\/api\/cms\/pages\/([^/]+)\/([^/]+)$/);
  if (pageMatch) {
    const [, category, slug] = pageMatch;
    const page = cmsManifest.pages.find(
      (entry) => entry.isActive && entry.category === category && entry.slug === slug
    );
    return page
      ? json(response, 200, publicPage(page))
      : json(response, 404, { message: "Page not found" });
  }
  if (url.pathname === "/api/contact-inquiries" && request.method === "POST") {
    for await (const chunk of request) void chunk;
    return json(response, 201, { accepted: true });
  }
  if (url.pathname.startsWith("/uploads/")) return serveAsset(url.pathname, request, response);
  return json(response, 404, { message: "Not found" });
});

server.listen(3100, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
