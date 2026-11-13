"use client";

import { useEffect, useRef, useState } from "react";
import { safeArticleUrl, type SourceReference } from "@/lib/article-content";

type TextNode = { type: "text"; text: string; marks?: { type: string; attrs?: { href: string } }[] };
type BlockNode = { type: "paragraph" | "heading" | "blockquote" | "bullet_list" | "ordered_list" | "list_item"; attrs?: { level?: number }; content?: (TextNode | BlockNode)[] };
type ArticleDoc = { type: "doc"; content: BlockNode[]; sources?: SourceReference[] };

const emptyDoc: ArticleDoc = { type: "doc", content: [] };

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function nodeHtml(node: TextNode | BlockNode): string {
  if (node.type === "text") {
    let html = escapeHtml((node as TextNode).text);
    for (const mark of (node as TextNode).marks || []) {
      if (mark.type === "bold") html = `<strong>${html}</strong>`;
      else if (mark.type === "italic") html = `<em>${html}</em>`;
      else if (mark.type === "underline") html = `<u>${html}</u>`;
      else if (mark.type === "strike") html = `<s>${html}</s>`;
      else if (mark.type === "link" && mark.attrs?.href && safeArticleUrl(mark.attrs.href)) html = `<a href="${escapeHtml(mark.attrs.href)}">${html}</a>`;
    }
    return html;
  }
  const children = (node.content || []).map(nodeHtml).join("");
  if (node.type === "heading") return `<h${node.attrs?.level === 3 ? 3 : 2}>${children}</h${node.attrs?.level === 3 ? 3 : 2}>`;
  if (node.type === "blockquote") return `<blockquote>${children}</blockquote>`;
  if (node.type === "bullet_list") return `<ul>${children}</ul>`;
  if (node.type === "ordered_list") return `<ol>${children}</ol>`;
  if (node.type === "list_item") return `<li>${children}</li>`;
  return `<p>${children}</p>`;
}

function documentFromHtml(root: HTMLElement): ArticleDoc {
  function inline(node: Node, marks: TextNode["marks"] = []): TextNode[] {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [{ type: "text", text: node.textContent, ...(marks.length ? { marks } : {}) }] : [];
    if (!(node instanceof HTMLElement)) return [];
    const tag = node.tagName.toLowerCase();
    let extra: NonNullable<TextNode["marks"]>[number] | null = null;
    if (tag === "b" || tag === "strong") extra = { type: "bold" };
    else if (tag === "i" || tag === "em") extra = { type: "italic" };
    else if (tag === "u") extra = { type: "underline" };
    else if (tag === "s" || tag === "strike" || tag === "del") extra = { type: "strike" };
    else if (tag === "a") {
      const href = safeArticleUrl(node.getAttribute("href"));
      if (href) extra = { type: "link", attrs: { href } };
    }
    return Array.from(node.childNodes).flatMap((child) => inline(child, extra ? [...marks, extra] : marks));
  }
  function blocks(element: Element): BlockNode[] {
    const output: BlockNode[] = [];
    for (const child of Array.from(element.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        output.push({ type: tag === "ul" ? "bullet_list" : "ordered_list", content: Array.from(child.children).filter((item) => item.tagName.toLowerCase() === "li").map((item) => ({ type: "list_item", content: [{ type: "paragraph", content: inline(item) }] })) });
        continue;
      }
      if (tag === "blockquote") { output.push({ type: "blockquote", content: blocks(child) }); continue; }
      if (/^h[1-6]$/.test(tag)) { output.push({ type: "heading", attrs: { level: tag === "h3" ? 3 : 2 }, content: inline(child) }); continue; }
      if (tag === "p" || tag === "div") { output.push({ type: "paragraph", content: inline(child) }); continue; }
      const content = inline(child);
      if (content.length) output.push({ type: "paragraph", content });
    }
    return output;
  }
  let content = blocks(root);
  if (!content.length && root.textContent?.trim()) content = [{ type: "paragraph", content: [{ type: "text", text: root.textContent.trim() }] }];
  return { type: "doc", content };
}

function safeInitialDoc(value: unknown): ArticleDoc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyDoc;
  const doc = value as Partial<ArticleDoc>;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return emptyDoc;
  return { type: "doc", content: doc.content as BlockNode[], sources: Array.isArray(doc.sources) ? doc.sources : [] };
}

export function ArticleRichTextEditor({ initialBody }: { initialBody?: unknown }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [bodyJson, setBodyJson] = useState(() => JSON.stringify(safeInitialDoc(initialBody)));
  const [sources, setSources] = useState<SourceReference[]>(() => safeInitialDoc(initialBody).sources || []);
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    if (editorRef.current && !editorRef.current.dataset.initialized) {
      editorRef.current.innerHTML = safeInitialDoc(initialBody).content.map(nodeHtml).join("");
      editorRef.current.dataset.initialized = "true";
    }
  }, [initialBody]);

  function syncDocument() {
    if (!editorRef.current) return;
    const next = documentFromHtml(editorRef.current);
    setBodyJson(JSON.stringify(next));
  }

  function command(commandName: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(commandName, false, value);
    syncDocument();
  }

  function addInlineLink() {
    const rawUrl = window.prompt("Paste the source URL (https://…)");
    if (!rawUrl) return;
    const url = safeArticleUrl(rawUrl);
    if (!url) { window.alert("Enter a valid http or https URL."); return; }
    command("createLink", url);
  }

  function addSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = safeArticleUrl(sourceUrl);
    if (!sourceLabel.trim() || !url) return;
    setSources((current) => [...current, { label: sourceLabel.trim().slice(0, 180), url }]);
    setSourceLabel("");
    setSourceUrl("");
  }

  return <div className="rich-editor-wrap">
    <input type="hidden" name="body" value={bodyJson} />
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Article formatting">
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("bold")} aria-label="Bold"><strong>B</strong></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("italic")} aria-label="Italic"><em>I</em></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("underline")} aria-label="Underline"><u>U</u></button>
      <span className="rich-toolbar-divider" />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("formatBlock", "<h2>")}>Headline</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("formatBlock", "<h3>")}>Subhead</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("formatBlock", "<blockquote>")}>Quote</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("formatBlock", "<p>")}>Paragraph</button>
      <span className="rich-toolbar-divider" />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("insertUnorderedList")}>• List</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("insertOrderedList")}>1. List</button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addInlineLink}><i className="bi bi-link-45deg" /> Add link</button>
    </div>
    <div ref={editorRef} className="rich-editor-content" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Article body" data-placeholder="Write the full article here…" onInput={syncDocument} />
    <p className="editor-field-hint">Select text before adding a link. Use the toolbar to format headings, emphasis, quotations and lists.</p>
    <section className="source-editor"><div><h3>Sources &amp; references</h3><p>Add source names with their original article links. They will appear as clickable references below the published story.</p></div>
      <input type="hidden" name="sources" value={JSON.stringify(sources)} />
      <ul>{sources.map((source, index) => <li key={`${source.url}-${index}`}><span><strong>{source.label}</strong><small>{source.url}</small></span><button type="button" onClick={() => setSources((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${source.label}`}>Remove</button></li>)}</ul>
      <form className="source-add-form" onSubmit={addSource}><label>Source name<input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} maxLength={180} placeholder="e.g. BBC News" required /></label><label>Source URL<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required /></label><button className="btn-waraka-outline" type="submit"><i className="bi bi-plus-lg" /> Add source</button></form>
    </section>
  </div>;
}
