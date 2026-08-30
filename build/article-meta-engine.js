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
      `Article metadata oluşturulamadı: "${fieldName}" alanı eksik.`
    );
  }
}

export function generateArticleMeta({
  metadata,
  route
}) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    throw new Error(
      "Article metadata oluşturulamadı: metadata nesnesi bulunamadı."
    );
  }

  if (
    !route ||
    typeof route !== "object"
  ) {
    throw new Error(
      "Article metadata oluşturulamadı: route nesnesi bulunamadı."
    );
  }

  validateRequiredField(
    metadata.title,
    "title"
  );

  validateRequiredField(
    metadata.slug,
    "slug"
  );

  validateRequiredField(
    metadata.category,
    "category"
  );

  validateRequiredField(
    metadata.topic,
    "topic"
  );

  validateRequiredField(
    metadata.type,
    "type"
  );

  validateRequiredField(
    metadata.status,
    "status"
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
    route.route,
    "route"
  );

  validateRequiredField(
    route.canonicalUrl,
    "canonicalUrl"
  );

  return {
    title: metadata.title,
    slug: metadata.slug,
    description: metadata.description ?? "",
    category: metadata.category,
    topic: metadata.topic,
    type: metadata.type,
    status: metadata.status,
    author: metadata.author,
    datePublished: metadata.datePublished,
    dateModified: metadata.dateModified,
    image: metadata.image ?? "",
    route: route.route,
    canonicalUrl: route.canonicalUrl
  };
}