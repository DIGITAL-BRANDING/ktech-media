import type { Json } from "@/lib/database.types";

export type SourceReference = { label: string; url: string };

export function safeArticleUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}

function normalizeInline(node: unknown, depth = 0): Json | null {
  if (depth > 20 || !node || typeof node !== "object") return null;
  const value = node as { type?: unknown; text?: unknown; marks?: unknown; content?: unknown };
  if (value.type === "text" && typeof value.text === "string") {
    const text = value.text.slice(0, 10000);
    const marks = Array.isArray(value.marks) ? value.marks.flatMap((mark) => {
      if (!mark || typeof mark !== "object") return [];
      const m = mark as { type?: unknown; attrs?: { href?: unknown } };
      if (["bold", "italic", "underline", "strike"].includes(String(m.type))) return [{ type: String(m.type) }];
      if (m.type === "link") {
        const href = safeArticleUrl(m.attrs?.href);
        return href ? [{ type: "link", attrs: { href } }] : [];
      }
      return [];
    }) : [];
    return { type: "text", text, ...(marks.length ? { marks: marks as Json[] } : {}) };
  }
  return null;
}

function normalizeBlock(node: unknown, depth = 0): Json | null {
  if (depth > 20 || !node || typeof node !== "object") return null;
  const value = node as { type?: unknown; level?: unknown; content?: unknown };
  const content = Array.isArray(value.content) ? value.content : [];
  const type = value.type;
  if (type === "paragraph") return { type, content: content.map((child) => normalizeInline(child, depth + 1)).filter((child): child is Json => child !== null) };
  if (type === "heading") return { type, attrs: { level: value.level === 3 ? 3 : 2 }, content: content.map((child) => normalizeInline(child, depth + 1)).filter((child): child is Json => child !== null) };
  if (type === "blockquote") return { type, content: content.map((child) => normalizeBlock(child, depth + 1)).filter((child): child is Json => child !== null) };
  if (type === "bullet_list" || type === "ordered_list") return { type, content: content.map((child) => normalizeBlock(child, depth + 1)).filter((child): child is Json => child !== null) };
  if (type === "list_item") return { type, content: content.map((child) => normalizeBlock(child, depth + 1)).filter((child): child is Json => child !== null) };
  return null;
}

export function normalizeArticleDocument(value: unknown, sourceValues?: unknown): Json {
  const doc = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (!doc || typeof doc !== "object") throw new Error("Invalid article document");
  const record = doc as { type?: unknown; content?: unknown; sources?: unknown };
  if (record.type !== "doc" || !Array.isArray(record.content)) throw new Error("Invalid article document");
  const content = record.content.map((node) => normalizeBlock(node)).filter((node): node is Json => node !== null);
  const sources = normalizeSourceReferences(sourceValues ?? record.sources);
  return { type: "doc", content, ...(sources.length ? { sources: sources as unknown as Json } : {}) };
}

export function normalizeSourceReferences(value: unknown): SourceReference[] {
  const sources = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (sources == null || sources === "") return [];
  if (!Array.isArray(sources)) throw new Error("Invalid source references");
  return sources.slice(0, 30).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as { label?: unknown; url?: unknown };
    const url = safeArticleUrl(source.url);
    const label = typeof source.label === "string" ? source.label.trim().slice(0, 180) : "";
    return url && label ? [{ label, url }] : [];
  });
}

export function articleDocumentText(value: Json): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(articleDocumentText).join(" ");
  if (value && typeof value === "object") return [typeof value.text === "string" ? value.text : "", ...(Array.isArray(value.content) ? value.content.map(articleDocumentText) : [])].join(" ");
  return "";
}
