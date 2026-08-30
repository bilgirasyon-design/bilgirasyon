  import fs from "node:fs/promises";
  import path from "node:path";
  import { fileURLToPath } from "node:url";
  import { parse } from "yaml";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const ROOT_DIR = path.resolve(
    __dirname,
    ".."
  );

  const CONTENT_DIR = path.join(
    ROOT_DIR,
    "content"
  );

  async function pathExists(targetPath) {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async function getMarkdownFiles(directory) {
    const entries = await fs.readdir(
      directory,
      {
        withFileTypes: true
      }
    );

    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
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
        path.extname(entry.name).toLowerCase() ===
          ".md"
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  function parseMarkdownMetadata(
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
        `Content index oluşturulamadı: Front Matter bulunamadı: ${path.relative(
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
        `Content index oluşturulamadı: Geçersiz Front Matter başlangıcı: ${path.relative(
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

    if (closingIndex === -1) {
      throw new Error(
        `Content index oluşturulamadı: Front Matter kapanışı bulunamadı: ${path.relative(
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
        `Content index oluşturulamadı: Metadata nesnesi okunamadı: ${path.relative(
          ROOT_DIR,
          filePath
        )}`
      );
    }

    return metadata;
  }

  function createContentRecord(
    metadata,
    filePath
  ) {
    return {
      sourcePath:
        path.relative(
          ROOT_DIR,
          filePath
        ),

      title:
        metadata.title ?? "",

      slug:
        metadata.slug ?? "",

      description:
        metadata.description ?? "",

      category:
        metadata.category ?? "",

      topic:
        metadata.topic ?? "",

      type:
        metadata.type ?? "",

      status:
        metadata.status ?? "",

      author:
        metadata.author ?? "",

      datePublished:
        metadata.datePublished ?? "",

      dateModified:
        metadata.dateModified ?? "",

      image:
        metadata.image ?? ""
    };
  }

  export async function loadContentIndex() {
    if (
      !(await pathExists(
        CONTENT_DIR
      ))
    ) {
      throw new Error(
        `Content klasörü bulunamadı: ${CONTENT_DIR}`
      );
    }

    const markdownFiles =
      await getMarkdownFiles(
        CONTENT_DIR
      );

    const records = [];

    for (
      const filePath of markdownFiles
    ) {
      const source =
        await fs.readFile(
          filePath,
          "utf8"
        );

      const metadata =
        parseMarkdownMetadata(
          source,
          filePath
        );

      records.push(
        createContentRecord(
          metadata,
          filePath
        )
      );
    }

    records.sort(
      (a, b) =>
        a.title.localeCompare(
          b.title,
          "tr"
        )
    );

    return records;
  }