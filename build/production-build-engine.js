import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRoute } from "./route-engine.js";
import { loadContentIndex } from "./content-index-loader.js";
import { buildContentGraph } from "./content-graph-engine.js";
import { generateBreadcrumbSchema, renderBreadcrumbHtml } from "./breadcrumb-engine.js";
import { generateRobotsTxt } from "./robots-engine.js";
import { generateSitemapFiles } from "./sitemap-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITE_CONFIG_FILE = path.join(ROOT_DIR, "data", "site.json");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeRoute(value) {
  const route = String(value ?? "").replace(/\\/g, "/");
  if (!route.startsWith("/")) return `/${route}/`;
  return route.endsWith("/") ? route : `${route}/`;
}

function extractInternalHrefs(html) {
  const hrefs = [];
  const pattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    hrefs.push(match[1]);
  }

  return hrefs;
}

function isRouteHref(href) {
  return (
    href.startsWith("/") &&
    href !== "/" &&
    !href.startsWith("//") &&
    !href.startsWith("/#") &&
    !href.startsWith("/assets/") &&
    !href.startsWith("/css/") &&
    !href.startsWith("/js/") &&
    !href.startsWith("/favicon") &&
    !href.startsWith("/sitemap") &&
    !href.startsWith("/robots.txt")
  );
}

function routeFromHref(href) {
  const clean = href.split("#")[0].split("?")[0];
  return normalizeRoute(clean);
}

function injectBeforeArticle(html, breadcrumbHtml) {
  const marker = "<article>";

  if (!html.includes(marker)) {
    throw new Error("Production Build Engine: <article> bulunamadı.");
  }

  if (html.includes('class="breadcrumb"')) {
    return html;
  }

  return html.replace(marker, `${breadcrumbHtml}\n    ${marker}`);
}

function injectSchema(html, schema) {
  const marker = "</head>";

  if (!html.includes(marker)) {
    throw new Error("Production Build Engine: </head> bulunamadı.");
  }

  return html.replace(
    marker,
    `\n  <script type="application/ld+json" data-bilgirasyon-schema="breadcrumb">\n${schema}\n  </script>\n${marker}`
  );
}

async function writeJson(filePath, value) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8"
  );
}

async function run() {
  if (!(await pathExists(DIST_DIR))) {
    throw new Error("Production Build Engine: dist bulunamadı. Önce build çalışmalıdır.");
  }

  const siteConfig = await readJson(SITE_CONFIG_FILE);
  const domain = siteConfig.site?.domain;
  const siteName = siteConfig.site?.name ?? "Bilgirasyon";

  if (!domain) {
    throw new Error("Production Build Engine: site.domain bulunamadı.");
  }

  const contentIndex = await loadContentIndex();
  const articles = [];
  const routeMap = new Map();

  for (const record of contentIndex) {
    if (record.status !== "published") continue;

    const contentFilePath = path.resolve(ROOT_DIR, record.sourcePath);
    const route = createRoute({
      contentFilePath,
      contentRoot: CONTENT_DIR,
      distRoot: DIST_DIR,
      domain
    });

    const article = {
      ...record,
      route: route.route,
      canonicalUrl: route.canonicalUrl,
      distPath: route.distPath
    };

    if (routeMap.has(route.route)) {
      throw new Error(`Production Build Engine: duplicate route: ${route.route}`);
    }

    routeMap.set(route.route, article);
    articles.push(article);
  }

  const graph = buildContentGraph(articles);
  const inbound = new Map(articles.map((article) => [article.route, 0]));
  const brokenLinks = [];

  for (const article of articles) {
    if (!(await pathExists(article.distPath))) {
      throw new Error(`Production Build Engine: HTML çıktısı bulunamadı: ${article.distPath}`);
    }

    let html = await fs.readFile(article.distPath, "utf8");

    const breadcrumbSchema = generateBreadcrumbSchema({
      metadata: article,
      route: article.canonicalUrl,
      domain,
      siteName
    });

    const breadcrumbHtml = renderBreadcrumbHtml({
      metadata: article,
      route: article.route,
      siteName
    });

    html = injectBeforeArticle(html, breadcrumbHtml);

    if (!html.includes('data-bilgirasyon-schema="breadcrumb"')) {
      html = injectSchema(html, breadcrumbSchema);
    }

    const hrefs = extractInternalHrefs(html);

    for (const href of hrefs) {
      if (!isRouteHref(href)) continue;

      const targetRoute = routeFromHref(href);
      const target = routeMap.get(targetRoute);

      if (!target) {
        brokenLinks.push({
          source: article.sourcePath,
          href,
          route: targetRoute
        });
        continue;
      }

      inbound.set(targetRoute, (inbound.get(targetRoute) ?? 0) + 1);
    }

    await fs.writeFile(article.distPath, html, "utf8");
  }

  if (brokenLinks.length > 0) {
    const details = brokenLinks
      .map((item) => `- ${item.source} -> ${item.href} (${item.route})`)
      .join("\n");

    throw new Error(
      `Production Build Engine: ${brokenLinks.length} broken internal link bulundu.\n${details}`
    );
  }

  const orphanContent = articles
    .filter((article) => (inbound.get(article.route) ?? 0) === 0)
    .map((article) => ({
      sourcePath: article.sourcePath,
      route: article.route,
      title: article.title,
      type: article.type
    }));

  const sitemap = generateSitemapFiles({
    articles,
    domain
  });

  for (const file of sitemap.files) {
    await fs.writeFile(path.join(DIST_DIR, file.name), file.content, "utf8");
  }

  const sitemapPath = sitemap.indexFile
    ? sitemap.indexFile.name
    : sitemap.files[0]?.name ?? "sitemap.xml";

  if (sitemap.indexFile) {
    await fs.writeFile(
      path.join(DIST_DIR, sitemap.indexFile.name),
      sitemap.indexFile.content,
      "utf8"
    );
  }

  await fs.writeFile(
    path.join(DIST_DIR, "robots.txt"),
    generateRobotsTxt({ domain, sitemapPath }),
    "utf8"
  );

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    site: domain,
    contentCount: articles.length,
    generatedHtmlCount: articles.length,
    sitemapUrlCount: sitemap.urlCount,
    sitemapFiles: [
      ...sitemap.files.map((file) => file.name),
      ...(sitemap.indexFile ? [sitemap.indexFile.name] : [])
    ],
    graphNodeCount: graph.nodes.length,
    orphanContentCount: orphanContent.length,
    brokenInternalLinkCount: 0,
    orphanContent,
    routes: articles.map((article) => ({
      route: article.route,
      canonicalUrl: article.canonicalUrl,
      sourcePath: article.sourcePath,
      title: article.title,
      dateModified: article.dateModified
    }))
  };

  manifest.hash = sha256(JSON.stringify(manifest));

  await writeJson(
    path.join(DIST_DIR, "build-manifest.json"),
    manifest
  );

  console.log(`→ dist/${sitemapPath}`);
  console.log("→ dist/robots.txt");
  console.log("→ dist/build-manifest.json");
  console.log(`→ Breadcrumb schema: ${articles.length}`);
  console.log(`→ Orphan content: ${orphanContent.length}`);
}

run().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error(" PRODUCTION BUILD BAŞARISIZ");
  console.error("========================================");
  console.error("");
  console.error(error.message);
  console.error("");
  process.exitCode = 1;
});
