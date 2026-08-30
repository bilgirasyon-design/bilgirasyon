import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRoute } from "./route-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(
  __dirname,
  ".."
);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function isSameContent(
  currentArticle,
  candidate
) {
  if (
    !currentArticle ||
    !candidate
  ) {
    return false;
  }

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
    score += 25;
  }

  if (
    candidate.type === "cluster"
  ) {
    score += 15;
  }

  if (
    candidate.type === "article"
  ) {
    score += 10;
  }

  if (
    candidate.type === "pillar"
  ) {
    score += 5;
  }

  return score;
}

function createCandidate(
  currentArticle,
  candidate,
  domain
) {
  const contentFilePath =
    path.resolve(
      ROOT_DIR,
      candidate.sourcePath
    );

  const contentRoot =
    path.join(
      ROOT_DIR,
      "content"
    );

  const distRoot =
    path.join(
      ROOT_DIR,
      "dist"
    );

  const route =
    createRoute({
      contentFilePath,
      contentRoot,
      distRoot,
      domain
    });

  return {
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description,
    category: candidate.category,
    topic: candidate.topic,
    type: candidate.type,
    status: candidate.status,
    route: route.route,
    canonicalUrl:
      route.canonicalUrl,
    score: calculateRelevance(
      currentArticle,
      candidate
    )
  };
}

export function generateInternalLinks({
  currentArticle,
  contentIndex,
  domain,
  limit = 5
}) {
  if (
    !currentArticle ||
    typeof currentArticle !== "object"
  ) {
    throw new Error(
      "Internal Link Engine: currentArticle gerekli."
    );
  }

  if (
    !Array.isArray(contentIndex)
  ) {
    throw new Error(
      "Internal Link Engine: contentIndex bir dizi olmalıdır."
    );
  }

  if (!domain) {
    throw new Error(
      "Internal Link Engine: domain gerekli."
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
          !isSameContent(
            currentArticle,
            candidate
          )
      )
      .map(
        (candidate) =>
          createCandidate(
            currentArticle,
            candidate,
            domain
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