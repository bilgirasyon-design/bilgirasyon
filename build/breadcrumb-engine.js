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
  return String(domain ?? "").trim().replace(/\/+$/, "");
}

export function generateBreadcrumbSchema({
  metadata,
  route,
  domain,
  siteName = "Bilgirasyon"
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

  const baseUrl = normalizeDomain(domain);
  const categoryName = String(metadata.category ?? "").trim();
  const categorySlug = normalizeSegment(categoryName);

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: siteName,
      item: `${baseUrl}/`
    }
  ];

  if (categoryName) {
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: categoryName,
      item: `${baseUrl}/${categorySlug}/`
    });
  }

  if (metadata.subcategory) {
    const subcategoryName = String(metadata.subcategory).trim();
    const subcategorySlug = normalizeSegment(subcategoryName);

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: subcategoryName,
      item: `${baseUrl}/${categorySlug}/${subcategorySlug}/`
    });
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: String(metadata.title).trim(),
    item: route
  });

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items
    },
    null,
    2
  );
}

export function renderBreadcrumbHtml({
  metadata,
  route,
  siteName = "Bilgirasyon"
}) {
  const categoryName = String(metadata.category ?? "").trim();
  const categorySlug = normalizeSegment(categoryName);
  const items = [
    `<li><a href="/">${siteName}</a></li>`
  ];

  if (categoryName) {
    items.push(
      `<li><a href="/${categorySlug}/">${categoryName}</a></li>`
    );
  }

  if (metadata.subcategory) {
    const subcategoryName = String(metadata.subcategory).trim();
    const subcategorySlug = normalizeSegment(subcategoryName);
    items.push(
      `<li><a href="/${categorySlug}/${subcategorySlug}/">${subcategoryName}</a></li>`
    );
  }

  items.push(`<li aria-current="page">${String(metadata.title).trim()}</li>`);

  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;
}
