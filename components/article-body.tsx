import type { Json } from "@/lib/database.types";
import { safeArticleUrl, type SourceReference } from "@/lib/article-content";

type Node = { type?: string; text?: string; attrs?: { level?: number; href?: string }; marks?: { type?: string; attrs?: { href?: string } }[]; content?: unknown[]; sources?: SourceReference[] };

function linkify(text: string) {
  const pieces = text.split(/(https?:\/\/[^\s<>()]+[\w/#])/gi);
  return pieces.map((piece, index) => {
    const url = safeArticleUrl(piece);
    return url ? <a key={index} href={url} target="_blank" rel="noopener noreferrer">{piece}</a> : piece;
  });
}

function renderInline(node: unknown, key: string | number): React.ReactNode {
  if (typeof node === "string") return linkify(node);
  if (!node || typeof node !== "object") return null;
  const value = node as Node;
  if (value.type === "text") {
    const hasEmbeddedLink = (value.marks || []).some((mark) => mark.type === "link");
    let content: React.ReactNode = hasEmbeddedLink ? (value.text || "") : linkify(value.text || "");
    for (const mark of value.marks || []) {
      if (mark.type === "bold") content = <strong key={`b-${key}`}>{content}</strong>;
      else if (mark.type === "italic") content = <em key={`i-${key}`}>{content}</em>;
      else if (mark.type === "underline") content = <u key={`u-${key}`}>{content}</u>;
      else if (mark.type === "strike") content = <s key={`s-${key}`}>{content}</s>;
      else if (mark.type === "link") {
        const href = safeArticleUrl(mark.attrs?.href);
        if (href) content = <a key={`a-${key}`} href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
      }
    }
    return <span key={key}>{content}</span>;
  }
  const children = (value.content || []).map((part, index) => renderInline(part, `${key}-${index}`));
  if (value.type === "heading") return value.attrs?.level === 3 ? <h3 key={key}>{children}</h3> : <h2 key={key}>{children}</h2>;
  if (value.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (value.type === "bullet_list") return <ul key={key}>{children}</ul>;
  if (value.type === "ordered_list") return <ol key={key}>{children}</ol>;
  if (value.type === "list_item") return <li key={key}>{children}</li>;
  if (value.type === "paragraph") return <p key={key}>{children}</p>;
  return <span key={key}>{children}</span>;
}

export function ArticleBody({ body }: { body: unknown }) {
  const jsonBody = body as Json;
  const document = jsonBody && typeof jsonBody === "object" && !Array.isArray(jsonBody) ? jsonBody as Node : {};
  const sources = Array.isArray(document.sources) ? document.sources.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as SourceReference;
    const url = safeArticleUrl(source.url);
    return url && typeof source.label === "string" ? [{ label: source.label, url }] : [];
  }) : [];
  const content = Array.isArray(document.content) ? document.content.map((node, index) => renderInline(node, index)) : renderInline(jsonBody, 0);
  return <>
    {content}
    {sources.length > 0 && <section className="article-sources" aria-labelledby="article-sources-heading"><h2 id="article-sources-heading">Sources &amp; references</h2><ol>{sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<i className="bi bi-box-arrow-up-right" aria-hidden="true" /></a></li>)}</ol></section>}
  </>;
}
