function normalizeDomain(domain) {
  return String(domain ?? "").trim().replace(/\/+$/, "");
}

export function generateRobotsTxt({
  domain,
  sitemapPath = "sitemap.xml"
}) {
  if (!domain) {
    throw new Error("Robots Engine: domain gerekli.");
  }

  const baseUrl = normalizeDomain(domain);

  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}/${String(sitemapPath).replace(/^\/+/, "")}`,
    ""
  ].join("\n");
}
