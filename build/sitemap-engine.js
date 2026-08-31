const MAX_URLS_PER_SITEMAP = 50000;
const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;

function normalizeDomain(domain) {
  return String(domain ?? "").trim().replace(/\/+$/, "");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createUrlEntry(article, domain) {
  const lastmod = article.dateModified || article.datePublished;
  const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "";

  return `<url><loc>${escapeXml(`${normalizeDomain(domain)}${article.route}`)}</loc>${lastmodTag}</url>`;
}

function serializeUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>\n`;
}

function serializeSitemapIndex(files, domain) {
  const baseUrl = normalizeDomain(domain);
  const entries = files.map(
    (file) => `<sitemap><loc>${escapeXml(`${baseUrl}/${file}`)}</loc></sitemap>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</sitemapindex>\n`;
}

export function generateSitemapFiles({
  articles,
  domain
}) {
  if (!Array.isArray(articles)) {
    throw new Error("Sitemap Engine: articles bir dizi olmalıdır.");
  }

  if (!domain) {
    throw new Error("Sitemap Engine: domain gerekli.");
  }

  const published = articles
    .filter((article) => article?.status === "published")
    .filter((article) => article?.route)
    .sort((a, b) => a.route.localeCompare(b.route, "tr"));

  const files = [];
  let currentEntries = [];
  let currentSize = 0;
  let index = 1;

  const flush = () => {
    if (currentEntries.length === 0) return;

    const name = `sitemap-${index}.xml`;
    const content = serializeUrlSet(currentEntries);
    files.push({ name, content });
    index += 1;
    currentEntries = [];
    currentSize = 0;
  };

  for (const article of published) {
    const entry = createUrlEntry(article, domain);
    const entrySize = Buffer.byteLength(entry, "utf8");

    if (
      currentEntries.length >= MAX_URLS_PER_SITEMAP ||
      currentSize + entrySize + 200 >= MAX_SITEMAP_BYTES
    ) {
      flush();
    }

    currentEntries.push(entry);
    currentSize += entrySize;
  }

  flush();

  const indexFile = files.length > 1
    ? {
        name: "sitemap-index.xml",
        content: serializeSitemapIndex(
          files.map((file) => file.name),
          domain
        )
      }
    : null;

  return {
    files,
    indexFile,
    urlCount: published.length
  };
}
