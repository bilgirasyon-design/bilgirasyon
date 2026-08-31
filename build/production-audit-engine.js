import fs from "node:fs/promises";
import path from "node:path";

function normalizeRoute(value) {
  const normalized = String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/[?#].*$/, "");

  if (normalized === "") return "/";
  if (!normalized.startsWith("/")) return `/${normalized}`;
  return normalized;
}

function normalizeAbsoluteUrl(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSingleTag(html, pattern, label, filePath) {
  const match = html.match(pattern);

  if (!match || !match[1]?.trim()) {
    throw new Error(
      `Production Audit: ${label} bulunamadı: ${filePath}`
    );
  }

  return match[1].trim();
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

function validateJsonLd(html, filePath) {
  const blocks = extractJsonLdBlocks(html);

  if (blocks.length === 0) {
    throw new Error(
      `Production Audit: JSON-LD bulunamadı: ${filePath}`
    );
  }

  for (const block of blocks) {
    try {
      JSON.parse(block);
    } catch (error) {
      throw new Error(
        `Production Audit: geçersiz JSON-LD: ${filePath} (${error.message})`
      );
    }
  }

  return blocks.length;
}

function validateCanonical(html, expectedUrl, filePath) {
  const canonicalPattern = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const canonical = extractSingleTag(
    html,
    canonicalPattern,
    "canonical URL",
    filePath
  );

  if (normalizeAbsoluteUrl(canonical) !== normalizeAbsoluteUrl(expectedUrl)) {
    throw new Error(
      `Production Audit: canonical URL eşleşmiyor: ${filePath}\n` +
      `Beklenen: ${expectedUrl}\n` +
      `Gerçek: ${canonical}`
    );
  }
}

function validateDocumentStructure(html, filePath) {
  if (!/<html\b/i.test(html)) {
    throw new Error(`Production Audit: <html> bulunamadı: ${filePath}`);
  }

  if (!/<head\b/i.test(html) || !/<\/head>/i.test(html)) {
    throw new Error(`Production Audit: <head> yapısı eksik: ${filePath}`);
  }

  if (!/<body\b/i.test(html) || !/<\/body>/i.test(html)) {
    throw new Error(`Production Audit: <body> yapısı eksik: ${filePath}`);
  }

  if (!/<main\b/i.test(html) && !/<article\b/i.test(html)) {
    throw new Error(
      `Production Audit: ana içerik container'ı bulunamadı: ${filePath}`
    );
  }

  const title = extractSingleTag(
    html,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
    "title",
    filePath
  );

  if (title.length === 0) {
    throw new Error(`Production Audit: title boş: ${filePath}`);
  }

  const description = extractSingleTag(
    html,
    /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    "meta description",
    filePath
  );

  if (description.length === 0) {
    throw new Error(`Production Audit: meta description boş: ${filePath}`);
  }
}

function extractInternalRoutes(html) {
  const routes = [];
  const pattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const href = match[1];

    if (!href.startsWith("/") || href.startsWith("//")) continue;
    if (/^\/(?:assets|css|js|favicon|sitemap|robots\.txt)(?:\/|$)/i.test(href)) continue;

    routes.push(normalizeRoute(href));
  }

  return routes;
}

function extractSitemapRoutes(xml) {
  const routes = [];
  const pattern = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    routes.push(match[1].trim());
  }

  return routes;
}

async function validateSitemaps({
  distDir,
  sitemapFiles,
  domain,
  expectedRoutes
}) {
  const expectedUrls = new Set(
    expectedRoutes.map((route) => `${normalizeAbsoluteUrl(domain)}${route}`)
  );

  const sitemapUrls = new Set();

  for (const file of sitemapFiles) {
    const filePath = path.join(distDir, file);
    const xml = await fs.readFile(filePath, "utf8");

    if (!xml.startsWith("<?xml")) {
      throw new Error(`Production Audit: geçersiz XML başlangıcı: ${file}`);
    }

    if (!/<(?:urlset|sitemapindex)\b/i.test(xml)) {
      throw new Error(`Production Audit: sitemap root bulunamadı: ${file}`);
    }

    for (const url of extractSitemapRoutes(xml)) {
      sitemapUrls.add(url);
    }
  }

  const missing = [...expectedUrls].filter((url) => !sitemapUrls.has(url));
  const unexpected = [...sitemapUrls].filter((url) => !expectedUrls.has(url));

  if (missing.length > 0 || unexpected.length > 0) {
    const details = [
      missing.length > 0 ? `Sitemap'te eksik URL: ${missing.join(", ")}` : "",
      unexpected.length > 0 ? `Sitemap'te beklenmeyen URL: ${unexpected.join(", ")}` : ""
    ].filter(Boolean).join("\n");

    throw new Error(`Production Audit: sitemap route bütünlüğü bozuk.\n${details}`);
  }

  return sitemapUrls.size;
}

export async function auditProductionOutput({
  distDir,
  articles,
  domain,
  sitemapFiles
}) {
  if (!Array.isArray(articles)) {
    throw new Error("Production Audit: articles bir dizi olmalıdır.");
  }

  if (!Array.isArray(sitemapFiles) || sitemapFiles.length === 0) {
    throw new Error("Production Audit: sitemap dosyaları bulunamadı.");
  }

  const normalizedDomain = normalizeAbsoluteUrl(domain);
  const routeSet = new Set();
  const canonicalSet = new Set();
  let jsonLdCount = 0;
  let internalLinkCount = 0;

  for (const article of articles) {
    const route = normalizeRoute(article.route);

    if (routeSet.has(route)) {
      throw new Error(`Production Audit: duplicate route: ${route}`);
    }

    routeSet.add(route);

    const expectedCanonical = `${normalizedDomain}${route}`;
    const filePath = article.distPath;
    const relativeFilePath = path.relative(distDir, filePath);
    const html = await fs.readFile(filePath, "utf8");

    validateDocumentStructure(html, relativeFilePath);
    validateCanonical(html, expectedCanonical, relativeFilePath);
    jsonLdCount += validateJsonLd(html, relativeFilePath);

    if (canonicalSet.has(expectedCanonical)) {
      throw new Error(
        `Production Audit: duplicate canonical URL: ${expectedCanonical}`
      );
    }

    canonicalSet.add(expectedCanonical);
    internalLinkCount += extractInternalRoutes(html).length;
  }

  const sitemapUrlCount = await validateSitemaps({
    distDir,
    sitemapFiles,
    domain: normalizedDomain,
    expectedRoutes: [...routeSet]
  });

  return {
    articleCount: articles.length,
    routeCount: routeSet.size,
    canonicalCount: canonicalSet.size,
    jsonLdCount,
    internalLinkCount,
    sitemapUrlCount
  };
}
