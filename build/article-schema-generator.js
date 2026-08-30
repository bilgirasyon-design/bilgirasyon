import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");

function normalizeUrl(domain, value) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedDomain =
    String(domain).replace(/\/+$/, "");

  const normalizedValue =
    String(value).replace(/^\/+/, "");

  return `${normalizedDomain}/${normalizedValue}`;
}

function validateRequiredField(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `Schema oluşturulamadı: "${fieldName}" alanı eksik.`
    );
  }
}

export function generateArticleSchema({
  metadata,
  domain,
  canonicalUrl
}) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    throw new Error(
      "Schema oluşturulamadı: metadata nesnesi bulunamadı."
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
    metadata.author,
    "author"
  );

  validateRequiredField(
    metadata.datePublished,
    "datePublished"
  );

  validateRequiredField(
    metadata.dateModified,
    "dateModified"
  );

  validateRequiredField(
    domain,
    "domain"
  );

  validateRequiredField(
    canonicalUrl,
    "canonicalUrl"
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",

    headline: metadata.title,

    description: metadata.description,

    author: {
      "@type": "Person",
      name: metadata.author
    },

    datePublished: metadata.datePublished,

    dateModified: metadata.dateModified,

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  if (metadata.image) {
    schema.image = [
      normalizeUrl(
        domain,
        metadata.image
      )
    ];
  }

  return JSON.stringify(
    schema,
    null,
    2
  );
}