import Link from "next/link";

export default function NotFound() {
  return <main className="section state-page"><div className="container state-page-card"><span className="eyebrow">404 / PAGE NOT FOUND</span><h1>We can’t find that page</h1><p>The link may be outdated or the story may have moved.</p><div><Link className="btn-waraka-primary" href="/news">Browse the latest news</Link><Link className="btn-waraka-outline" href="/">Go to homepage</Link></div></div></main>;
}
