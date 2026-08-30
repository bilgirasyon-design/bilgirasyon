import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(
  __dirname,
  ".."
);

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
      `SEO oluşturulamadı: "${fieldName}" alanı eksik.`
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function generateSeoData({
  metadata,
  siteConfig,
  canonicalUrl
}) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    throw new Error(
      "SEO oluşturulamadı: metadata nesnesi bulunamadı."
    );
  }

  if (
    !siteConfig ||
    typeof siteConfig !== "object"
  ) {
    throw new Error(
      "SEO oluşturulamadı: siteConfig nesnesi bulunamadı."
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

  const siteName =
    siteConfig.site?.name ??
    "Bilgirasyon";

  const language =
    siteConfig.site?.language ??
    "tr-TR";

  const robots =
    siteConfig.seo?.defaultRobots ??
    "index, follow";

  const title =
    `${metadata.title} | ${siteName}`;

  const description =
    metadata.description;

  return {
    language,
    title,
    description,
    robots,
    canonicalUrl,

    html: {
      title: escapeHtml(title),
      description: escapeHtml(description),
      robots: escapeHtml(robots),
      canonicalUrl: escapeHtml(
        canonicalUrl
      )
    }
  };
}