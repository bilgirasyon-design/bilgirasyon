import path from "node:path";

const CONTENT_DIRECTORY_NAME = "content";
const INDEX_FILE_NAME = "index.html";

function normalizeSegment(value) {
  return String(value)
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

function normalizeRoute(route) {
  const normalized = route
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/");

  if (!normalized.startsWith("/")) {
    return `/${normalized}/`;
  }

  if (!normalized.endsWith("/")) {
    return `${normalized}/`;
  }

  return normalized;
}

function getContentRelativePath(contentFilePath, contentRoot) {
  const relativePath = path.relative(
    contentRoot,
    contentFilePath
  );

  return relativePath
    .replace(/\\/g, "/");
}

function createRouteFromSourcePath(
  contentFilePath,
  contentRoot
) {
  const relativePath = getContentRelativePath(
    contentFilePath,
    contentRoot
  );

  const segments = relativePath.split("/");

  if (segments.length < 2) {
    throw new Error(
      `İçerik dosyası geçerli bir content route'u oluşturamıyor: ${relativePath}`
    );
  }

  const fileName = segments.at(-1);

  if (!fileName.toLowerCase().endsWith(".md")) {
    throw new Error(
      `Route Engine yalnızca Markdown dosyalarını destekler: ${relativePath}`
    );
  }

  const directorySegments = segments.slice(0, -1);

  const slugFromFileName = path
    .basename(fileName, ".md");

  const routeSegments = [
    ...directorySegments,
    slugFromFileName
  ].map(normalizeSegment);

  return normalizeRoute(
    routeSegments.join("/")
  );
}

function createDistPathFromRoute(
  route,
  distRoot
) {
  const routeWithoutLeadingSlash =
    route.replace(/^\/+/, "");

  const routeWithoutTrailingSlash =
    routeWithoutLeadingSlash.replace(/\/+$/, "");

  return path.join(
    distRoot,
    routeWithoutTrailingSlash,
    INDEX_FILE_NAME
  );
}

function createCanonicalUrl(
  domain,
  route
) {
  const normalizedDomain = String(domain)
    .trim()
    .replace(/\/+$/, "");

  const normalizedRoute = normalizeRoute(route);

  return `${normalizedDomain}${normalizedRoute}`;
}

export function createRoute({
  contentFilePath,
  contentRoot,
  distRoot,
  domain
}) {
  if (!contentFilePath) {
    throw new Error(
      "Route Engine: contentFilePath gerekli."
    );
  }

  if (!contentRoot) {
    throw new Error(
      "Route Engine: contentRoot gerekli."
    );
  }

  if (!distRoot) {
    throw new Error(
      "Route Engine: distRoot gerekli."
    );
  }

  if (!domain) {
    throw new Error(
      "Route Engine: domain gerekli."
    );
  }

  const route = createRouteFromSourcePath(
    contentFilePath,
    contentRoot
  );

  const distPath = createDistPathFromRoute(
    route,
    distRoot
  );

  const canonicalUrl = createCanonicalUrl(
    domain,
    route
  );

  return {
    route,
    canonicalUrl,
    distPath
  };
}

export {
  normalizeSegment,
  normalizeRoute
};