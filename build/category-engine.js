function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function createCategoryRecord(category) {
  return {
    name: category,
    slug: normalizeText(category)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ğüşıöç-]/gi, "")
  };
}

export function generateCategories(
  contentIndex
) {
  if (!Array.isArray(contentIndex)) {
    throw new Error(
      "Category Engine: contentIndex bir dizi olmalıdır."
    );
  }

  const categoryMap = new Map();

  for (const article of contentIndex) {
    if (
      !article ||
      article.status !== "published"
    ) {
      continue;
    }

    const category =
      String(
        article.category ?? ""
      ).trim();

    if (!category) {
      continue;
    }

    if (!categoryMap.has(category)) {
      categoryMap.set(
        category,
        {
          ...createCategoryRecord(
            category
          ),
          articles: []
        }
      );
    }

    categoryMap
      .get(category)
      .articles
      .push({
        title: article.title,
        slug: article.slug,
        description:
          article.description,
        topic: article.topic,
        type: article.type,
        route: article.route ?? "",
        canonicalUrl:
          article.canonicalUrl ?? "",
        image: article.image ?? ""
      });
  }

  const categories =
    [...categoryMap.values()]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "tr"
          )
      );

  for (const category of categories) {
    category.articles.sort(
      (a, b) =>
        a.title.localeCompare(
          b.title,
          "tr"
        )
    );
  }

  return categories;
}