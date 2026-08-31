function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function isPublished(article) {
  return article?.status === "published";
}

function isSameArticle(a, b) {
  if (a?.sourcePath && b?.sourcePath) {
    return a.sourcePath === b.sourcePath;
  }

  return Boolean(a?.slug && b?.slug && a.slug === b.slug);
}

function relationScore(current, candidate) {
  let score = 0;

  const topic = normalizeText(current.topic);
  const candidateTopic = normalizeText(candidate.topic);
  const category = normalizeText(current.category);
  const candidateCategory = normalizeText(candidate.category);

  if (topic && topic === candidateTopic) {
    score += 100;
  }

  if (category && category === candidateCategory) {
    score += 30;
  }

  if (current.type === "pillar" && candidate.type === "cluster") {
    score += 40;
  }

  if (current.type === "cluster" && candidate.type === "pillar") {
    score += 40;
  }

  if (candidate.type === "cluster") {
    score += 10;
  }

  return score;
}

function createNode(article) {
  return {
    sourcePath: article.sourcePath ?? "",
    title: article.title ?? "",
    slug: article.slug ?? "",
    description: article.description ?? "",
    category: article.category ?? "",
    topic: article.topic ?? "",
    type: article.type ?? "",
    status: article.status ?? "",
    route: article.route ?? "",
    canonicalUrl: article.canonicalUrl ?? "",
    image: article.image ?? ""
  };
}

export function buildContentGraph(contentIndex) {
  if (!Array.isArray(contentIndex)) {
    throw new Error(
      "Content Graph Engine: contentIndex bir dizi olmalıdır."
    );
  }

  const nodes = contentIndex
    .filter(isPublished)
    .map(createNode);

  const nodeBySourcePath = new Map();
  const nodeBySlug = new Map();

  for (const node of nodes) {
    if (node.sourcePath) {
      nodeBySourcePath.set(node.sourcePath, node);
    }

    if (node.slug) {
      nodeBySlug.set(node.slug, node);
    }
  }

  const relations = new Map();

  for (const node of nodes) {
    const candidates = nodes
      .filter((candidate) => !isSameArticle(node, candidate))
      .map((candidate) => ({
        node: candidate,
        score: relationScore(node, candidate)
      }))
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.node.title.localeCompare(b.node.title, "tr")
      );

    relations.set(node.sourcePath || node.slug, candidates);
  }

  const inboundCounts = new Map();

  for (const node of nodes) {
    inboundCounts.set(node.sourcePath || node.slug, 0);
  }

  return {
    nodes,
    nodeBySourcePath,
    nodeBySlug,
    relations,
    inboundCounts
  };
}

export function getRelatedGraphNodes(graph, article, limit = 10) {
  if (!graph || !(graph.relations instanceof Map)) {
    throw new Error(
      "Content Graph Engine: geçerli bir graph gerekli."
    );
  }

  const key = article?.sourcePath || article?.slug;
  const relations = graph.relations.get(key) ?? [];

  return relations
    .slice(0, Math.max(0, Number(limit)))
    .map((item) => ({
      ...item.node,
      score: item.score
    }));
}

export function getOrphanNodes(graph) {
  if (!graph || !Array.isArray(graph.nodes)) {
    throw new Error(
      "Content Graph Engine: geçerli bir graph gerekli."
    );
  }

  return graph.nodes.filter((node) => {
    const key = node.sourcePath || node.slug;
    return (graph.inboundCounts.get(key) ?? 0) === 0;
  });
}
