"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalRouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("Unhandled page error:", error); }, [error]);
  return <main className="section state-page"><div className="container state-page-card"><i className="bi bi-exclamation-triangle" aria-hidden="true" /><span className="eyebrow">K-TECH MEDIA NETWORK</span><h1>Something went wrong</h1><p>The page could not be loaded. Try again, or return to the newsroom homepage.</p><div><button className="btn-waraka-primary" type="button" onClick={() => retry()}>Try again</button><Link className="btn-waraka-outline" href="/">Go to homepage</Link></div>{error.digest && <small>Reference: {error.digest}</small>}</div></main>;
}
