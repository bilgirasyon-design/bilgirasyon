function validateRequiredField(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `Open Graph oluşturulamadı: "${fieldName}" alanı eksik.`
    );
  }
}

function normalizeUrl(
  domain,
  value
) {
  if (!value) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      String(value)
    )
  ) {
    return String(value);
  }

  const normalizedDomain =
    String(domain).replace(
      /\/+$/,
      ""
    );

  const normalizedValue =
    String(value).replace(
      /^\/+/,
      ""
    );

  return `${normalizedDomain}/${normalizedValue}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function generateOpenGraphData({
  metadata,
  siteConfig,
  canonicalUrl
}) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    throw new Error(
      "Open Graph oluşturulamadı: metadata nesnesi bulunamadı."
    );
  }

  if (
    !siteConfig ||
    typeof siteConfig !== "object"
  ) {
    throw new Error(
      "Open Graph oluşturulamadı: siteConfig nesnesi bulunamadı."
    );
  }

  validateRequiredField(
    metadata.title,
    "title"
  );

  validateRequiredField(
    metadata.description,
    "description"
  );

  validateRequiredField(
    canonicalUrl,
    "canonicalUrl"
  );

  const domain =
    siteConfig.site?.domain;

  validateRequiredField(
    domain,
    "domain"
  );

  const siteName =
    siteConfig.site?.name ??
    "Bilgirasyon";

  const image =
    metadata.image
      ? normalizeUrl(
          domain,
          metadata.image
        )
      : "";

  return {
    title: metadata.title,
    description: metadata.description,
    url: canonicalUrl,
    type: "article",
    siteName,
    image,

    html: {
      title: escapeHtml(
        metadata.title
      ),
      description: escapeHtml(
        metadata.description
      ),
      url: escapeHtml(
        canonicalUrl
      ),
      type: "article",
      siteName: escapeHtml(
        siteName
      ),
      image: escapeHtml(
        image
      )
    }
  };
}