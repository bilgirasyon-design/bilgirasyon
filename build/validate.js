import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

import { createRoute } from "./route-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");

const CONTENT_DIR = path.join(ROOT_DIR, "content");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITE_CONFIG_FILE = path.join(ROOT_DIR, "data", "site.json");

const REQUIRED_METADATA = [
  "title",
  "slug",
  "description",
  "category",
  "topic",
  "type",
  "status",
  "author",
  "datePublished",
  "dateModified"
];

const VALID_CONTENT_TYPES = new Set([
  "pillar",
  "cluster",
  "article"
]);

const VALID_STATUSES = new Set([
  "draft",
  "published"
]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function getMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await getMarkdownFiles(fullPath);
      files.push(...nestedFiles);
      continue;
    }

    if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".md"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseMarkdownFile(source, filePath) {
  const normalizedSource = source.replace(/^\uFEFF/, "");

  if (!normalizedSource.startsWith("---")) {
    throw new Error(
      `Front Matter bulunamadı: ${path.relative(ROOT_DIR, filePath)}`
    );
  }

  const lines = normalizedSource.split(/\r?\n/);

  if (lines[0].trim() !== "---") {
    throw new Error(
      `Geçersiz Front Matter başlangıcı: ${path.relative(ROOT_DIR, filePath)}`
    );
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );

  if (closingIndex === -1) {
    throw new Error(
      `Front Matter kapanışı bulunamadı: ${path.relative(ROOT_DIR, filePath)}`
    );
  }

  const frontMatterSource = lines
    .slice(1, closingIndex)
    .join("\n");

  const markdown = lines
    .slice(closingIndex + 1)
    .join("\n")
    .trim();

  const metadata = parse(frontMatterSource);

  if (!metadata || typeof metadata !== "object") {
    throw new Error(
      `Metadata nesnesi okunamadı: ${path.relative(ROOT_DIR, filePath)}`
    );
  }

  return {
    metadata,
    markdown
  };
}

function validateMetadata(metadata, filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);

  for (const field of REQUIRED_METADATA) {
    if (
      metadata[field] === undefined ||
      metadata[field] === null ||
      String(metadata[field]).trim() === ""
    ) {
      throw new Error(
        `${relativePath}: Eksik metadata alanı: "${field}"`
      );
    }
  }

  if (!VALID_CONTENT_TYPES.has(metadata.type)) {
    throw new Error(
      `${relativePath}: Geçersiz content type: "${metadata.type}". ` +
      `Geçerli değerler: ${[...VALID_CONTENT_TYPES].join(", ")}`
    );
  }

  if (!VALID_STATUSES.has(metadata.status)) {
    throw new Error(
      `${relativePath}: Geçersiz status: "${metadata.status}". ` +
      `Geçerli değerler: ${[...VALID_STATUSES].join(", ")}`
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) {
    throw new Error(
      `${relativePath}: Geçersiz slug: "${metadata.slug}"`
    );
  }

  if (
    typeof metadata.description !== "string" ||
    metadata.description.length > 160
  ) {
    throw new Error(
      `${relativePath}: description 160 karakteri geçmemelidir.`
    );
  }

  if (metadata.build !== undefined) {
    if (
      typeof metadata.build !== "object" ||
      Array.isArray(metadata.build)
    ) {
      throw new Error(
        `${relativePath}: "build" alanı bir nesne olmalıdır.`
      );
    }

    const buildFlags = [
      "forceRebuild",
      "refreshLinks",
      "refreshRelated",
      "refreshSEO"
    ];

    for (const flag of buildFlags) {
      if (
        metadata.build[flag] !== undefined &&
        typeof metadata.build[flag] !== "boolean"
      ) {
        throw new Error(
          `${relativePath}: build.${flag} boolean olmalıdır.`
        );
      }
    }
  }
}

function countOccurrences(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function validateHtml(
  html,
  metadata,
  canonicalUrl,
  outputFile
) {
  const relativeOutput = path.relative(ROOT_DIR, outputFile);

  const titleMatches = countOccurrences(
    html,
    /<title\b[^>]*>[\s\S]*?<\/title>/gi
  );

  if (titleMatches !== 1) {
    throw new Error(
      `${relativeOutput}: HTML içinde tam olarak 1 <title> bulunmalıdır. ` +
      `Bulunan: ${titleMatches}`
    );
  }

  const expectedTitle = `${metadata.title} | Bilgirasyon`;

  if (!html.includes(`<title>${expectedTitle}</title>`)) {
    throw new Error(
      `${relativeOutput}: <title> beklenen değerle eşleşmiyor.`
    );
  }

  const descriptionMatches = countOccurrences(
    html,
    /<meta\b[^>]*name=["']description["'][^>]*>/gi
  );

  if (descriptionMatches !== 1) {
    throw new Error(
      `${relativeOutput}: HTML içinde tam olarak 1 description meta etiketi bulunmalıdır. ` +
      `Bulunan: ${descriptionMatches}`
    );
  }

  const canonicalMatches = countOccurrences(
    html,
    /<link\b[^>]*rel=["']canonical["'][^>]*>/gi
  );

  if (canonicalMatches !== 1) {
    throw new Error(
      `${relativeOutput}: HTML içinde tam olarak 1 canonical etiketi bulunmalıdır. ` +
      `Bulunan: ${canonicalMatches}`
    );
  }

  if (!html.includes(canonicalUrl)) {
    throw new Error(
      `${relativeOutput}: Canonical URL beklenen değerle eşleşmiyor.`
    );
  }

  const h1Count = countOccurrences(
    html,
    /<h1\b[^>]*>/gi
  );

  if (h1Count !== 1) {
    throw new Error(
      `${relativeOutput}: HTML içinde tam olarak 1 <h1> bulunmalıdır. ` +
      `Bulunan: ${h1Count}`
    );
  }

  const htmlLangMatch = html.match(
    /<html\b[^>]*lang=["']([^"']+)["']/i
  );

  if (!htmlLangMatch) {
    throw new Error(
      `${relativeOutput}: <html> lang attribute bulunamadı.`
    );
  }

  if (htmlLangMatch[1] !== "tr-TR") {
    throw new Error(
      `${relativeOutput}: HTML dili tr-TR olmalıdır. ` +
      `Bulunan: ${htmlLangMatch[1]}`
    );
  }

  if (!html.includes('name="robots"')) {
    throw new Error(
      `${relativeOutput}: robots meta etiketi bulunamadı.`
    );
  }
}

async function validate() {
  const startedAt = Date.now();

  console.log("");
  console.log("========================================");
  console.log(" Bilgirasyon Validation System");
  console.log("========================================");
  console.log("");

  if (!(await pathExists(CONTENT_DIR))) {
    throw new Error(
      `Content klasörü bulunamadı: ${CONTENT_DIR}`
    );
  }

  if (!(await pathExists(DIST_DIR))) {
    throw new Error(
      `Dist klasörü bulunamadı: ${DIST_DIR}. Önce npm run build çalıştırın.`
    );
  }

  if (!(await pathExists(SITE_CONFIG_FILE))) {
    throw new Error(
      `Site configuration bulunamadı: ${SITE_CONFIG_FILE}`
    );
  }

  const siteConfig = await readJson(SITE_CONFIG_FILE);

  const domain = siteConfig.site?.domain;

  if (!domain) {
    throw new Error(
      "site.json içerisinde site.domain bulunamadı."
    );
  }

  const markdownFiles = await getMarkdownFiles(CONTENT_DIR);

  if (markdownFiles.length === 0) {
    throw new Error(
      "content/ içerisinde hiçbir Markdown dosyası bulunamadı."
    );
  }

  console.log(
    `Markdown dosyası: ${markdownFiles.length}`
  );
  console.log("");

  const slugMap = new Map();
  const routeMap = new Map();

  let validatedCount = 0;

  for (const filePath of markdownFiles) {
    const source = await fs.readFile(filePath, "utf8");

    const {
      metadata
    } = parseMarkdownFile(source, filePath);

    validateMetadata(metadata, filePath);

    if (slugMap.has(metadata.slug)) {
      const previousFile = slugMap.get(metadata.slug);

      throw new Error(
        `Duplicate slug tespit edildi:\n` +
        `- ${path.relative(ROOT_DIR, previousFile)}\n` +
        `- ${path.relative(ROOT_DIR, filePath)}\n` +
        `Slug: ${metadata.slug}`
      );
    }

    slugMap.set(metadata.slug, filePath);

    const route = createRoute({
      contentFilePath: filePath,
      contentRoot: CONTENT_DIR,
      distRoot: DIST_DIR,
      domain
    });

    if (routeMap.has(route.route)) {
      const previousArticle = routeMap.get(route.route);

      throw new Error(
        `Duplicate route tespit edildi:\n` +
        `- ${path.relative(ROOT_DIR, previousArticle.sourcePath)}\n` +
        `- ${path.relative(ROOT_DIR, filePath)}\n` +
        `Route: ${route.route}`
      );
    }

    routeMap.set(route.route, {
      sourcePath: filePath,
      metadata
    });

    const outputFile = route.distPath;

    if (!(await pathExists(outputFile))) {
      throw new Error(
        `${path.relative(ROOT_DIR, filePath)}: ` +
        `Beklenen HTML çıktısı bulunamadı:\n` +
        `${path.relative(ROOT_DIR, outputFile)}`
      );
    }

    const html = await fs.readFile(
      outputFile,
      "utf8"
    );

    if (html.trim() === "") {
      throw new Error(
        `${path.relative(ROOT_DIR, outputFile)}: HTML dosyası boş.`
      );
    }

    validateHtml(
      html,
      metadata,
      route.canonicalUrl,
      outputFile
    );

    validatedCount++;

    console.log(
      `✓ ${path.relative(ROOT_DIR, filePath)}`
    );

    console.log(
      `  Route: ${route.route}`
    );

    console.log(
      `  HTML: ${path.relative(ROOT_DIR, outputFile)}`
    );
  }

  const elapsedMs = Date.now() - startedAt;

  console.log("");
  console.log("========================================");
  console.log(" VALIDATION BAŞARILI");
  console.log("========================================");
  console.log(
    `Kontrol edilen içerik : ${validatedCount}`
  );
  console.log(
    `Kontrol edilen HTML   : ${validatedCount}`
  );
  console.log(
    `Süre                  : ${elapsedMs} ms`
  );
  console.log("");
}

validate().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error(" VALIDATION BAŞARISIZ");
  console.error("========================================");
  console.error("");
  console.error(error.message);
  console.error("");

  process.exitCode = 1;
});