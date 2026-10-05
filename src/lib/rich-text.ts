export const FONTS = [
  { id: "default", label: "Default", family: "var(--font-editor-default)" },
  { id: "hind", label: "হিন্দ শিলিগুড়ি", family: "var(--font-hind-siliguri)" },
  { id: "ador", label: "Li Ador — লি আদর", family: "var(--font-li-ador)" },
  { id: "arial", label: "Arial", family: "Arial" },
  { id: "times", label: "Times New Roman", family: "Times New Roman" },
] as const;
export const FONT_SIZES = Array.from({ length: 15 }, (_, index) => index + 8);

function typographyHtml(value: string) {
  let depth = 0;
  const html = value.replace(/\[\[font:([a-z-]*):([0-9]*)\]\]|\[\[\/font\]\]/g, (token, fontId: string | undefined, rawSize: string | undefined) => {
    if (token === "[[/font]]") {
      if (!depth) return "";
      depth--;
      return "</span>";
    }
    const font = FONTS.find((item) => item.id === fontId);
    const size = Number(rawSize);
    const styles = [
      font ? `font-family:${font.family}` : "",
      rawSize && Number.isInteger(size) && size >= 8 && size <= 22 ? `font-size:${size}pt` : "",
    ].filter(Boolean).join(";");
    depth++;
    return `<span${styles ? ` style="${styles}"` : ""}>`;
  });
  return html + "</span>".repeat(depth);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkup(value: string) {
  const html = escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return typographyHtml(html);
}

/** Converts the editor's small, safe markup format to display HTML. */
export function richTextToHtml(value: string) {
  if (!value) return "";
  const document = readRichTextDocument(value);
  if (document) return renderDocumentNode(document);
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;

  const closeList = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };

  lines.forEach((line) => {
    const bullet = line.match(/^\s*[-•]\s+(.+)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      const nextList = bullet ? "ul" : "ol";
      if (list !== nextList) {
        closeList();
        list = nextList;
        html.push(`<${nextList}>`);
      }
      html.push(`<li>${inlineMarkup((bullet ?? numbered)![1])}</li>`);
      return;
    }

    closeList();
    if (!line.trim()) {
      html.push('<div class="rich-text-spacer" aria-hidden="true"></div>');
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${inlineMarkup(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3>${inlineMarkup(line.slice(4))}</h3>`);
    } else {
      html.push(`<p>${inlineMarkup(line)}</p>`);
    }
  });
  closeList();
  return html.join("");
}

export function richTextToPlainText(value: string) {
  const document = readRichTextDocument(value);
  if (document) return documentPlainText(document).trim();
  return value
    .replace(/\[\[font:[a-z-]*:[0-9]*\]\]|\[\[\/font\]\]/g, "")
    .replace(/^#{2,3}\s+/gm, "")
    .replace(/^\s*(?:[-•]|\d+[.)])\s+/gm, "")
    .replace(/\*\*|\+\+|==|~~|\*/g, "")
    .trim();
}


export const RICH_TEXT_PREFIX = "richtext:v1:";

export type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: RichTextNode[];
};

export function readRichTextDocument(value: string): RichTextNode | null {
  if (!value.startsWith(RICH_TEXT_PREFIX)) return null;
  try {
    const document = JSON.parse(value.slice(RICH_TEXT_PREFIX.length));
    return document && document.type === "doc" && Array.isArray(document.content) ? document : null;
  } catch { return null; }
}

export function saveRichTextDocument(document: RichTextNode): string {
  return documentPlainText(document).trim() ? RICH_TEXT_PREFIX + JSON.stringify(document) : "";
}

export function normalizeFontSize(value: unknown) {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?(?:pt|px)$/.test(value)) return null;
  const points = parseFloat(value) * (value.endsWith("px") ? 0.75 : 1);
  return `${Math.min(22, Math.max(8, Math.round(points)))}pt`;
}

export function normalizeFontFamily(value: unknown) {
  if (typeof value !== "string") return null;
  const family = value.replace(/["']/g, "").trim();
  return FONTS.find((item) => item.family === family)?.family ?? null;
}

function fontSizeStyle(value: unknown) {
  const size = normalizeFontSize(value);
  return size ? `font-size:${size}` : "";
}

function renderDocumentNode(node: RichTextNode, depth = 0): string {
  if (!node || typeof node !== "object" || depth > 100) return "";
  if (node.type === "text") {
    let text = escapeHtml(typeof node.text === "string" ? node.text : "");
    for (const mark of Array.isArray(node.marks) ? node.marks : []) {
      if (!mark || typeof mark !== "object") continue;
      const tags: Record<string, string> = { bold: "strong", italic: "em", underline: "u", strike: "s", highlight: "mark" };
      const tag = tags[mark.type];
      if (tag) text = `<${tag}>${text}</${tag}>`;
      if (mark.type === "textStyle") {
        const family = normalizeFontFamily(mark.attrs?.fontFamily);
        const style = [family ? `font-family:${family}` : "", fontSizeStyle(mark.attrs?.fontSize)].filter(Boolean).join(";");
        if (style) text = `<span style="${style}">${text}</span>`;
      }
    }
    return text;
  }
  const children = (Array.isArray(node.content) ? node.content : []).map((child) => renderDocumentNode(child, depth + 1)).join("");
  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children || "<br>"}</p>`;
    case "heading": { const level = node.attrs?.level === 2 ? 2 : 3; return `<h${level}>${children}</h${level}>`; }
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": {
      const start = Number(node.attrs?.start);
      return `<ol${Number.isSafeInteger(start) && start > 1 ? ` start="${start}"` : ""}>${children}</ol>`;
    }
    case "listItem": return `<li>${children}</li>`;
    case "hardBreak": return "<br>";
    default: return children;
  }
}

function documentPlainText(node: RichTextNode, depth = 0): string {
  if (!node || typeof node !== "object" || depth > 100) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (node.type === "hardBreak") return "\n";
  const children = (Array.isArray(node.content) ? node.content : []).map((child) => documentPlainText(child, depth + 1)).join("");
  return ["paragraph", "heading"].includes(node.type ?? "") ? children + "\n" : children;
}

