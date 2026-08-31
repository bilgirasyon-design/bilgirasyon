function normalizeSegment(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDomain(domain) {
  return String(domain ?? "")
    .trim()
    .replace(/\/+$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasRoute(availableRoutes, route) {
  return availableRoutes instanceof Set && availableRoutes.has(route);
}

function createBreadcrumbEntries({
  metadata,
  route,
  domain,
  siteName,
  availableRoutes
}) {
  const baseUrl = normalizeDomain(domain);
  const categoryName = String(metadata.category ?? "").trim();
  const categorySlug = normalizeSegment(categoryName);
  const categoryRoute = `/${categorySlug}/`;

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: siteName,
      item: `${baseUrl}/`
    }
  ];

  if (categoryName) {
    const item = {
      "@type": "ListItem",
      position: items.length + 1,
      name: categoryName
    };

    if (hasRoute(availableRoutes, categoryRoute)) {
      item.item = `${baseUrl}${categoryRoute}`;
    }

    items.push(item);
  }

  if (metadata.subcategory) {
    const subcategoryName = String(metadata.subcategory).trim();
    const subcategorySlug = normalizeSegment(subcategoryName);
    const subcategoryRoute = `/${categorySlug}/${subcategorySlug}/`;
    const item = {
      "@type": "ListItem",
      position: items.length + 1,
      name: subcategoryName
    };

    if (hasRoute(availableRoutes, subcategoryRoute)) {
      item.item = `${baseUrl}${subcategoryRoute}`;
    }

    items.push(item);
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: String(metadata.title).trim(),
    item: route
  });

  return items;
}

export function generateBreadcrumbSchema({
  metadata,
  route,
  domain,
  siteName = "Bilgirasyon",
  availableRoutes = new Set()
}) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Breadcrumb Engine: metadata gerekli.");
  }

  if (!route) {
    throw new Error("Breadcrumb Engine: route gerekli.");
  }

  if (!domain) {
    throw new Error("Breadcrumb Engine: domain gerekli.");
  }

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: createBreadcrumbEntries({
        metadata,
        route,
        domain,
        siteName,
        availableRoutes
      })
    },
    null,
    2
  );
}

export function renderBreadcrumbHtml({
  metadata,
  route,
  siteName = "Bilgirasyon",
  availableRoutes = new Set()
}) {
  const categoryName = String(metadata.category ?? "").trim();
  const categorySlug = normalizeSegment(categoryName);
  const categoryRoute = `/${categorySlug}/`;
  const items = [
    `<li><a href="/">${escapeHtml(siteName)}</a></li>`
  ];

  if (categoryName) {
    items.push(
      hasRoute(availableRoutes, categoryRoute)
        ? `<li><a href="${categoryRoute}">${escapeHtml(categoryName)}</a></li>`
        : `<li>${escapeHtml(categoryName)}</li>`
    );
  }

  if (metadata.subcategory) {
    const subcategoryName = String(metadata.subcategory).trim();
    const subcategorySlug = normalizeSegment(subcategoryName);
    const subcategoryRoute = `/${categorySlug}/${subcategorySlug}/`;

    items.push(
      hasRoute(availableRoutes, subcategoryRoute)
        ? `<li><a href="${subcategoryRoute}">${escapeHtml(subcategoryName)}</a></li>`
        : `<li>${escapeHtml(subcategoryName)}</li>`
    );
  }

  items.push(
    `<li aria-current="page">${escapeHtml(metadata.title)}</li>`
  );

  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;
}
