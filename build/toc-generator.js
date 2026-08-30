function normalizeHeadingText(text) {
  return String(text)
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function createHeadingId(text) {
  return normalizeHeadingText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createUniqueId(
  baseId,
  usedIds
) {
  let id = baseId || "baslik";
  let counter = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  usedIds.add(id);

  return id;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function generateToc(markdown) {
  if (
    markdown === undefined ||
    markdown === null
  ) {
    throw new Error(
      "TOC oluşturulamadı: markdown içeriği bulunamadı."
    );
  }

  const source =
    String(markdown);

  const lines =
    source.split(/\r?\n/);

  const items = [];
  const usedIds = new Set();

  for (
    let index = 0;
    index < lines.length;
    index++
  ) {
    const line =
      lines[index];

    const match =
      /^(#{2,3})\s+(.+?)\s*$/.exec(
        line
      );

    if (!match) {
      continue;
    }

    const level =
      match[1].length;

    const text =
      normalizeHeadingText(
        match[2]
      );

    if (!text) {
      continue;
    }

    const baseId =
      createHeadingId(text);

    const id =
      createUniqueId(
        baseId,
        usedIds
      );

    items.push({
      level,
      text,
      id,

      html: {
        text: escapeHtml(text),
        id: escapeHtml(id),

        link:
          `#${escapeHtml(id)}`
      }
    });
  }

  return {
    items,
    count: items.length,
    hasItems: items.length > 0
  };
}