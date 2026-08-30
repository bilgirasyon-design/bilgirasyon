import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(
  __dirname,
  ".."
);

const ARTICLE_TEMPLATE_FILE = path.join(
  ROOT_DIR,
  "templates",
  "article.html"
);

async function loadTemplate(templatePath) {
  try {
    return await fs.readFile(
      templatePath,
      "utf8"
    );
  } catch (error) {
    throw new Error(
      `Template okunamadı: ${templatePath}\n${error.message}`
    );
  }
}

function replacePlaceholder(
  template,
  placeholder,
  value
) {
  const token = `{{${placeholder}}}`;

  if (!template.includes(token)) {
    throw new Error(
      `Template içerisinde gerekli placeholder bulunamadı: ${token}`
    );
  }

  return template.replaceAll(
    token,
    String(value ?? "")
  );
}

export async function renderArticleTemplate(
  data
) {
  let template =
    await loadTemplate(
      ARTICLE_TEMPLATE_FILE
    );

  template =
    replacePlaceholder(
      template,
      "LANGUAGE",
      data.language
    );

  template =
    replacePlaceholder(
      template,
      "TITLE",
      data.title
    );

  template =
    replacePlaceholder(
      template,
      "DESCRIPTION",
      data.description
    );

  template =
    replacePlaceholder(
      template,
      "ROBOTS",
      data.robots
    );

  template =
    replacePlaceholder(
      template,
      "CANONICAL_URL",
      data.canonicalUrl
    );

  template =
    replacePlaceholder(
      template,
      "ARTICLE_META",
      data.articleMeta
    );

  template =
    replacePlaceholder(
      template,
      "OPEN_GRAPH",
      data.openGraph
    );

  template =
    replacePlaceholder(
      template,
      "TWITTER_CARD",
      data.twitterCard
    );

  template =
    replacePlaceholder(
      template,
      "SCHEMA",
      data.schema
    );

  template =
    replacePlaceholder(
      template,
      "TOC",
      data.toc
    );

  template =
    replacePlaceholder(
      template,
      "CONTENT",
      data.contentHtml
    );

  template =
    replacePlaceholder(
      template,
      "RELATED_POSTS",
      data.relatedPosts
    );

  template =
    replacePlaceholder(
      template,
      "INTERNAL_LINKS",
      data.internalLinks
    );

  return template;
}