import Link from "next/link";

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <section className="page-intro"><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{action && <Link href={action.href} className="btn-waraka-primary">{action.label}<i className="bi bi-arrow-right" aria-hidden="true" /></Link>}</div></section>;
}
