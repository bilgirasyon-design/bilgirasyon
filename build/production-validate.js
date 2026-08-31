import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getHtmlFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await getHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

async function validate() {
  const manifestPath = path.join(
    DIST_DIR,
    "build-manifest.json"
  );

  if (!(await pathExists(manifestPath))) {
    throw new Error(
      "Production Validation: build-manifest.json bulunamadı. npm run build çalıştırın."
    );
  }

  const manifest = await readJson(manifestPath);
  const htmlFiles = await getHtmlFiles(DIST_DIR);
  const articleHtmlFiles = htmlFiles.filter(
    (file) => !file.includes(`${path.sep}data${path.sep}`)
  );

  if (articleHtmlFiles.length !== manifest.generatedHtmlCount) {
    throw new Error(
      `Production Validation: HTML sayısı manifest ile eşleşmiyor. Manifest: ${manifest.generatedHtmlCount}, gerçek: ${articleHtmlFiles.length}`
    );
  }

  if (manifest.brokenInternalLinkCount !== 0) {
    throw new Error(
      `Production Validation: broken internal link sayısı sıfır olmalıdır. Bulunan: ${manifest.brokenInternalLinkCount}`
    );
  }

  const robotsPath = path.join(DIST_DIR, "robots.txt");

  if (!(await pathExists(robotsPath))) {
    throw new Error(
      "Production Validation: dist/robots.txt bulunamadı."
    );
  }

  const robots = await fs.readFile(robotsPath, "utf8");

  if (!robots.includes("User-agent: *") || !robots.includes("Allow: /")) {
    throw new Error(
      "Production Validation: robots.txt temel kuralları eksik."
    );
  }

  const sitemapFiles = manifest.sitemapFiles ?? [];

  if (sitemapFiles.length === 0) {
    throw new Error(
      "Production Validation: sitemap çıktısı bulunamadı."
    );
  }

  for (const file of sitemapFiles) {
    if (!(await pathExists(path.join(DIST_DIR, file)))) {
      throw new Error(
        `Production Validation: sitemap çıktısı bulunamadı: ${file}`
      );
    }
  }

  let breadcrumbCount = 0;

  for (const file of articleHtmlFiles) {
    const html = await fs.readFile(file, "utf8");

    if (!html.includes('class="breadcrumb"')) {
      throw new Error(
        `Production Validation: breadcrumb bulunamadı: ${path.relative(ROOT_DIR, file)}`
      );
    }

    if (!html.includes('data-bilgirasyon-schema="breadcrumb"')) {
      throw new Error(
        `Production Validation: BreadcrumbList schema bulunamadı: ${path.relative(ROOT_DIR, file)}`
      );
    }

    breadcrumbCount++;
  }

  console.log(`✓ Production manifest: ${manifest.generatedHtmlCount} HTML`);
  console.log(`✓ Sitemap: ${manifest.sitemapUrlCount} URL`);
  console.log(`✓ Robots: hazır`);
  console.log(`✓ Breadcrumb: ${breadcrumbCount} HTML`);
  console.log(`✓ Broken internal links: 0`);
  console.log(`✓ Orphan content: ${manifest.orphanContentCount}`);
}

validate().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error(" PRODUCTION VALIDATION BAŞARISIZ");
  console.error("========================================");
  console.error("");
  console.error(error.message);
  console.error("");
  process.exitCode = 1;
});
