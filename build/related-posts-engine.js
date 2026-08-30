function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function isSameArticle(
  currentArticle,
  candidate
) {
  if (
    currentArticle.sourcePath &&
    candidate.sourcePath
  ) {
    return (
      currentArticle.sourcePath ===
      candidate.sourcePath
    );
  }

  if (
    currentArticle.slug &&
    candidate.slug
  ) {
    return (
      currentArticle.slug ===
      candidate.slug
    );
  }

  return false;
}

function calculateRelevance(
  currentArticle,
  candidate
) {
  let score = 0;

  const currentTopic =
    normalizeText(
      currentArticle.topic
    );

  const candidateTopic =
    normalizeText(
      candidate.topic
    );

  const currentCategory =
    normalizeText(
      currentArticle.category
    );

  const candidateCategory =
    normalizeText(
      candidate.category
    );

  if (
    currentTopic &&
    candidateTopic &&
    currentTopic === candidateTopic
  ) {
    score += 100;
  }

  if (
    currentCategory &&
    candidateCategory &&
    currentCategory === candidateCategory
  ) {
    score += 30;
  }

  if (
    candidate.type === "cluster"
  ) {
    score += 20;
  }

  if (
    candidate.type === "article"
  ) {
    score += 15;
  }

  if (
    candidate.type === "pillar"
  ) {
    score += 5;
  }

  return score;
}

function createRelatedPost(
  currentArticle,
  candidate
) {
  return {
    title: candidate.title,
    slug: candidate.slug,
    description:
      candidate.description,
    category: candidate.category,
    topic: candidate.topic,
    type: candidate.type,
    status: candidate.status,
    route: candidate.route ?? "",
    canonicalUrl:
      candidate.canonicalUrl ?? "",
    image: candidate.image ?? "",
    score: calculateRelevance(
      currentArticle,
      candidate
    )
  };
}

export function generateRelatedPosts({
  currentArticle,
  contentIndex,
  limit = 4
}) {
  if (
    !currentArticle ||
    typeof currentArticle !== "object"
  ) {
    throw new Error(
      "Related Posts Engine: currentArticle gerekli."
    );
  }

  if (
    !Array.isArray(contentIndex)
  ) {
    throw new Error(
      "Related Posts Engine: contentIndex bir dizi olmalıdır."
    );
  }

  const candidates =
    contentIndex
      .filter(
        (candidate) =>
          candidate &&
          candidate.status ===
            "published"
      )
      .filter(
        (candidate) =>
          !isSameArticle(
            currentArticle,
            candidate
          )
      )
      .map(
        (candidate) =>
          createRelatedPost(
            currentArticle,
            candidate
          )
      )
      .filter(
        (candidate) =>
          candidate.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.title.localeCompare(
            b.title,
            "tr"
          )
      );

  return candidates.slice(
    0,
    Math.max(
      0,
      Number(limit)
    )
  );
}