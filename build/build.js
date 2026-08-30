import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { parse } from "yaml";

import { createRoute } from "./route-engine.js";
import { renderArticleTemplate } from "./template-engine.js";

import {
  generateArticleMeta
} from "./article-meta-engine.js";

import {
  generateArticleSchema
} from "./article-schema-generator.js";

import {
  generateSeoData
} from "./seo-engine.js";

import {
  generateOpenGraphData
} from "./open-graph-engine.js";

import {
  generateTwitterCardData
} from "./twitter-card-engine.js";

import {
  generateToc
} from "./toc-generator.js";

import {
  generateInternalLinks
} from "./internal-link-engine.js";

import {
  generateRelatedPosts
} from "./related-posts-engine.js";

import {
  generateCategories
} from "./category-engine.js";

import {
  loadContentIndex
} from "./content-index-loader.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const ROOT_DIR =
  path.resolve(
    __dirname,
    ".."
  );

const CONTENT_DIR =
  path.join(
    ROOT_DIR,
    "content"
  );

const DIST_DIR =
  path.join(
    ROOT_DIR,
    "dist"
  );

const SITE_CONFIG_FILE =
  path.join(
    ROOT_DIR,
    "data",
    "site.json"
  );

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

const VALID_CONTENT_TYPES =
  new Set([
    "pillar",
    "cluster",
    "article"
  ]);

const VALID_STATUSES =
  new Set([
    "draft",
    "published"
  ]);

async function pathExists(
  targetPath
) {
  try {
    await fs.access(
      targetPath
    );

    return true;
  } catch {
    return false;
  }
}

async function readJson(
  filePath
) {
  const content =
    await fs.readFile(
      filePath,
      "utf8"
    );

  return JSON.parse(
    content
  );
}

async function getMarkdownFiles(
  directory
) {
  const entries =
    await fs.readdir(
      directory,
      {
        withFileTypes: true
      }
    );

  const files = [];

  for (
    const entry of entries
  ) {
    const fullPath =
      path.join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      const nestedFiles =
        await getMarkdownFiles(
          fullPath
        );

      files.push(
        ...nestedFiles
      );

      continue;
    }

    if (
      entry.isFile() &&
      path.extname(
        entry.name
      ).toLowerCase() === ".md"
    ) {
      files.push(
        fullPath
      );
    }
  }

  return files;
}

function parseMarkdownFile(
  source,
  filePath
) {
  const normalizedSource =
    source.replace(
      /^\uFEFF/,
      ""
    );

  if (
    !normalizedSource.startsWith(
      "---"
    )
  ) {
    throw new Error(
      `Front Matter bulunamadı: ${path.relative(
        ROOT_DIR,
        filePath
      )}`
    );
  }

  const lines =
    normalizedSource.split(
      /\r?\n/
    );

  if (
    lines[0].trim() !== "---"
  ) {
    throw new Error(
      `Geçersiz Front Matter başlangıcı: ${path.relative(
        ROOT_DIR,
        filePath
      )}`
    );
  }

  const closingIndex =
    lines.findIndex(
      (line, index) =>
        index > 0 &&
        line.trim() === "---"
    );

  if (
    closingIndex === -1
  ) {
    throw new Error(
      `Front Matter kapanışı bulunamadı: ${path.relative(
        ROOT_DIR,
        filePath
      )}`
    );
  }

  const frontMatterSource =
    lines
      .slice(
        1,
        closingIndex
      )
      .join("\n");

  const markdown =
    lines
      .slice(
        closingIndex + 1
      )
      .join("\n")
      .trim();

  const metadata =
    parse(
      frontMatterSource
    );

  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new Error(
      `Metadata nesnesi okunamadı: ${path.relative(
        ROOT_DIR,
        filePath
      )}`
    );
  }

  return {
    metadata,
    markdown
  };
}

function validateMetadata(
  metadata,
  filePath
) {
  const relativePath =
    path.relative(
      ROOT_DIR,
      filePath
    );

  for (
    const field of REQUIRED_METADATA
  ) {
    if (
      metadata[field] === undefined ||
      metadata[field] === null ||
      String(
        metadata[field]
      ).trim() === ""
    ) {
      throw new Error(
        `${relativePath}: Eksik metadata alanı: "${field}"`
      );
    }
  }

  if (
    !VALID_CONTENT_TYPES.has(
      metadata.type
    )
  ) {
    throw new Error(
      `${relativePath}: Geçersiz content type: "${metadata.type}". ` +
      `Geçerli değerler: ${[
        ...VALID_CONTENT_TYPES
      ].join(", ")}`
    );
  }

  if (
    !VALID_STATUSES.has(
      metadata.status
    )
  ) {
    throw new Error(
      `${relativePath}: Geçersiz status: "${metadata.status}". ` +
      `Geçerli değerler: ${[
        ...VALID_STATUSES
      ].join(", ")}`
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      metadata.slug
    )
  ) {
    throw new Error(
      `${relativePath}: Geçersiz slug: "${metadata.slug}"`
    );
  }

  if (
    typeof metadata.description !==
      "string" ||
    metadata.description.length > 160
  ) {
    throw new Error(
      `${relativePath}: description 160 karakteri geçmemelidir.`
    );
  }

  if (
    metadata.build !== undefined
  ) {
    if (
      typeof metadata.build !==
        "object" ||
      Array.isArray(
        metadata.build
      )
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

    for (
      const flag of buildFlags
    ) {
      if (
        metadata.build[flag] !==
          undefined &&
        typeof metadata.build[flag] !==
          "boolean"
      ) {
        throw new Error(
          `${relativePath}: build.${flag} boolean olmalıdır.`
        );
      }
    }
  }
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function renderArticleMetaHtml(
  articleMeta
) {
  return [
    `<meta name="author" content="${escapeHtml(
      articleMeta.author
    )}">`,
    `<meta name="article:published_time" content="${escapeHtml(
      articleMeta.datePublished
    )}">`,
    `<meta name="article:modified_time" content="${escapeHtml(
      articleMeta.dateModified
    )}">`,
    `<meta name="article:section" content="${escapeHtml(
      articleMeta.category
    )}">`
  ].join("\n");
}

function renderOpenGraphHtml(
  openGraph
) {
  const tags = [
    `<meta property="og:title" content="${escapeHtml(
      openGraph.title
    )}">`,
    `<meta property="og:description" content="${escapeHtml(
      openGraph.description
    )}">`,
    `<meta property="og:url" content="${escapeHtml(
      openGraph.url
    )}">`,
    `<meta property="og:type" content="${escapeHtml(
      openGraph.type
    )}">`,
    `<meta property="og:site_name" content="${escapeHtml(
      openGraph.siteName
    )}">`
  ];

  if (
    openGraph.image
  ) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(
        openGraph.image
      )}">`
    );
  }

  return tags.join(
    "\n"
  );
}

function renderTwitterCardHtml(
  twitterCard
) {
  const tags = [
    `<meta name="twitter:card" content="${escapeHtml(
      twitterCard.card
    )}">`,
    `<meta name="twitter:title" content="${escapeHtml(
      twitterCard.title
    )}">`,
    `<meta name="twitter:description" content="${escapeHtml(
      twitterCard.description
    )}">`,
    `<meta name="twitter:url" content="${escapeHtml(
      twitterCard.url
    )}">`
  ];

  if (
    twitterCard.image
  ) {
    tags.push(
      `<meta name="twitter:image" content="${escapeHtml(
        twitterCard.image
      )}">`
    );
  }

  return tags.join(
    "\n"
  );
}

function renderTocHtml(
  toc
) {
  if (
    !toc.hasItems
  ) {
    return "";
  }

  const items =
    toc.items
      .map(
        (item) => {
          const className =
            item.level === 2
              ? "toc-item toc-level-2"
              : "toc-item toc-level-3";

          return (
            `<li class="${className}">` +
            `<a href="#${item.html.id}">${item.html.text}</a>` +
            `</li>`
          );
        }
      )
      .join("\n");

  return (
    `<nav class="article-toc" aria-label="İçindekiler">` +
    `<h2>İçindekiler</h2>` +
    `<ul>` +
    items +
    `</ul>` +
    `</nav>`
  );
}

function renderRelatedPostsHtml(
  relatedPosts
) {
  if (
    !Array.isArray(
      relatedPosts
    ) ||
    relatedPosts.length === 0
  ) {
    return "";
  }

  const items =
    relatedPosts
      .map(
        (post) =>
          `<li class="related-post">` +
          `<a href="${escapeHtml(
            post.route
          )}">` +
          `<h3>${escapeHtml(
            post.title
          )}</h3>` +
          `<p>${escapeHtml(
            post.description
          )}</p>` +
          `</a>` +
          `</li>`
      )
      .join("\n");

  return (
    `<section class="related-posts" aria-labelledby="related-posts-title">` +
    `<h2 id="related-posts-title">İlgili Yazılar</h2>` +
    `<ul>` +
    items +
    `</ul>` +
    `</section>`
  );
}

function renderInternalLinksHtml(
  internalLinks
) {
  if (
    !Array.isArray(
      internalLinks
    ) ||
    internalLinks.length === 0
  ) {
    return "";
  }

  const items =
    internalLinks
      .map(
        (link) =>
          `<li class="internal-link">` +
          `<a href="${escapeHtml(
            link.route
          )}">${escapeHtml(
            link.title
          )}</a>` +
          `</li>`
      )
      .join("\n");

  return (
    `<nav class="internal-links" aria-label="İlgili bağlantılar">` +
    `<ul>` +
    items +
    `</ul>` +
    `</nav>`
  );
}

async function build() {
  const startedAt =
    Date.now();

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    " Bilgirasyon Build System"
  );
  console.log(
    "========================================"
  );
  console.log("");

  if (
    !(await pathExists(
      CONTENT_DIR
    ))
  ) {
    throw new Error(
      `Content klasörü bulunamadı: ${CONTENT_DIR}`
    );
  }

  if (
    !(await pathExists(
      SITE_CONFIG_FILE
    ))
  ) {
    throw new Error(
      `Site configuration bulunamadı: ${SITE_CONFIG_FILE}`
    );
  }

  const siteConfig =
    await readJson(
      SITE_CONFIG_FILE
    );

  const domain =
    siteConfig.site?.domain;

  if (!domain) {
    throw new Error(
      "site.json içerisinde site.domain bulunamadı."
    );
  }

  const markdownFiles =
    await getMarkdownFiles(
      CONTENT_DIR
    );

  if (
    markdownFiles.length === 0
  ) {
    throw new Error(
      "content/ içerisinde hiçbir Markdown dosyası bulunamadı."
    );
  }

  console.log(
    `Markdown dosyası: ${markdownFiles.length}`
  );

  console.log("");

  const articles = [];
  const slugMap =
    new Map();

  const routeMap =
    new Map();

  for (
    const filePath of markdownFiles
  ) {
    const source =
      await fs.readFile(
        filePath,
        "utf8"
      );

    const {
      metadata,
      markdown
    } =
      parseMarkdownFile(
        source,
        filePath
      );

    validateMetadata(
      metadata,
      filePath
    );

    if (
      slugMap.has(
        metadata.slug
      )
    ) {
      const previousFile =
        slugMap.get(
          metadata.slug
        );

      throw new Error(
        `Duplicate slug tespit edildi:\n` +
        `- ${path.relative(
          ROOT_DIR,
          previousFile
        )}\n` +
        `- ${path.relative(
          ROOT_DIR,
          filePath
        )}\n` +
        `Slug: ${metadata.slug}`
      );
    }

    slugMap.set(
      metadata.slug,
      filePath
    );

    const route =
      createRoute({
        contentFilePath:
          filePath,

        contentRoot:
          CONTENT_DIR,

        distRoot:
          DIST_DIR,

        domain
      });

    if (
      routeMap.has(
        route.route
      )
    ) {
      const previousArticle =
        routeMap.get(
          route.route
        );

      throw new Error(
        `Duplicate route tespit edildi:\n` +
        `- ${path.relative(
          ROOT_DIR,
          previousArticle.sourcePath
        )}\n` +
        `- ${path.relative(
          ROOT_DIR,
          filePath
        )}\n` +
        `Route: ${route.route}`
      );
    }

    routeMap.set(
      route.route,
      {
        sourcePath:
          filePath,

        metadata
      }
    );

    const contentHtml =
      marked.parse(
        markdown
      );
  

    articles.push({
      sourcePath:
        filePath,

      metadata,

      markdown,

      contentHtml,

      route
    });

    console.log(
      `✓ ${path.relative(
        ROOT_DIR,
        filePath
      )}`
    );

    console.log(
      `  Route: ${route.route}`
    );
  }

  console.log("");

  const contentIndex =
    await loadContentIndex();

  for (
    const record of contentIndex
  ) {
    const recordPath =
      path.resolve(
        ROOT_DIR,
        record.sourcePath
      );

    const recordRoute =
      createRoute({
        contentFilePath:
          recordPath,

        contentRoot:
          CONTENT_DIR,

        distRoot:
          DIST_DIR,

        domain
      });

    record.route =
      recordRoute.route;

    record.canonicalUrl =
      recordRoute.canonicalUrl;
  }

  const categories =
    generateCategories(
      contentIndex
    );

  await fs.rm(
    DIST_DIR,
    {
      recursive: true,
      force: true
    }
  );

  await fs.mkdir(
    DIST_DIR,
    {
      recursive: true
    }
  );

  const categoriesOutput =
    path.join(
      DIST_DIR,
      "data",
      "categories.json"
    );

  await fs.mkdir(
    path.dirname(
      categoriesOutput
    ),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    categoriesOutput,
    JSON.stringify(
      categories,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `→ ${path.relative(
      ROOT_DIR,
      categoriesOutput
    )}`
  );

  let generatedCount =
    0;

  for (
    const article of articles
  ) {
    const outputFile =
      article.route.distPath;

    await fs.mkdir(
      path.dirname(
        outputFile
      ),
      {
        recursive: true
      }
    );

    const seo =
      generateSeoData({
        metadata:
          article.metadata,

        siteConfig,

        domain,

        canonicalUrl:
          article.route
            .canonicalUrl
      });

    const articleMeta =
      generateArticleMeta({
        metadata:
          article.metadata,

        route:
          article.route
      });

    const openGraph =
      generateOpenGraphData({
        metadata:
          article.metadata,

        siteConfig,

        canonicalUrl:
          article.route
            .canonicalUrl
      });

    const twitterCard =
      generateTwitterCardData({
        metadata:
          article.metadata,

        siteConfig,

        canonicalUrl:
          article.route
            .canonicalUrl
      });

    const toc =
      generateToc(
        article.markdown
      );

    const internalLinks =
      generateInternalLinks({
        currentArticle:
          article.metadata,

        contentIndex,

        domain,

        limit: 5
      });

    const relatedPosts =
      generateRelatedPosts({
        currentArticle:
          article.metadata,

        contentIndex,

        limit: 4
      });

    const schema =
      generateArticleSchema({
        metadata:
          article.metadata,

        domain,

        canonicalUrl:
          article.route
            .canonicalUrl
      });

    const html =
      await renderArticleTemplate({
        language:
          seo.language,

        title:
          seo.title,

        description:
          seo.description,

        robots:
          seo.robots,

        canonicalUrl:
          seo.canonicalUrl,

        articleMeta:
          renderArticleMetaHtml(
            articleMeta
          ),

        openGraph:
          renderOpenGraphHtml(
            openGraph
          ),

        twitterCard:
          renderTwitterCardHtml(
            twitterCard
          ),

        schema,

        toc:
          renderTocHtml(
            toc
          ),

        contentHtml:
          article.contentHtml,

        relatedPosts:
          renderRelatedPostsHtml(
            relatedPosts
          ),

        internalLinks:
          renderInternalLinksHtml(
            internalLinks
          )
      });

    await fs.writeFile(
      outputFile,
      html,
      "utf8"
    );

    generatedCount++;

    console.log(
      `→ ${path.relative(
        ROOT_DIR,
        outputFile
      )}`
    );
  }

  const elapsedMs =
    Date.now() -
    startedAt;

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    " BUILD TAMAMLANDI"
  );

  console.log(
    "========================================"
  );

  console.log(
    `İşlenen içerik : ${articles.length}`
  );

  console.log(
    `Üretilen HTML  : ${generatedCount}`
  );

  console.log(
    `Kategori       : ${categories.length}`
  );

  console.log(
    `Content index  : ${contentIndex.length}`
  );

  console.log(
    `Süre           : ${elapsedMs} ms`
  );

  console.log("");
}

build().catch(
  (error) => {
    console.error("");

    console.error(
      "========================================"
    );

    console.error(
      " BUILD BAŞARISIZ"
    );

    console.error(
      "========================================"
    );

    console.error("");

    console.error(
      error.message
    );

    console.error("");

    process.exitCode = 1;
  }
);