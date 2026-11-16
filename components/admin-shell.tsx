"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-provider";

const sections = [
  {
    label: "Gudanarwa",
    links: [
      { href: "/admin", label: "Dashboard", icon: "bi-grid-1x2" },
      { href: "/admin/articles", label: "Labarai", icon: "bi-newspaper" },
      { href: "/admin/review", label: "Jerin tantancewa", icon: "bi-check2-square" },
      { href: "/admin/comments", label: "Comments", icon: "bi-chat-dots" },
    ],
  },
  {
    label: "Media",
    links: [
      { href: "/admin/videos", label: "Bidiyo", icon: "bi-camera-video" },
      { href: "/admin/photos", label: "Photo stories", icon: "bi-images" },
      { href: "/admin/broadcast", label: "Live broadcast", icon: "bi-broadcast" },
      { href: "/admin/audio", label: "Radio & Podcasts", icon: "bi-soundwave" },
    ],
  },
  {
    label: "Tsarin site",
    links: [
      { href: "/admin/categories", label: "Rukunin labarai", icon: "bi-tags" },
      { href: "/admin/staff", label: "Ma’aikata da izini", icon: "bi-people" },
      { href: "/admin/settings", label: "Saitunan site", icon: "bi-sliders" },
      { href: "/admin/marketing", label: "Audience & Ads", icon: "bi-megaphone" },
    ],
  },
];

const routeNames: Array<[string, string]> = [
  ["/admin/articles/new", "Sabon labari"],
  ["/admin/articles/", "Labarai"],
  ["/admin/photos/new", "Sabon photo story"],
  ["/admin/photos/", "Preview na photo story"],
  ["/admin/videos/new", "Sabon bidiyo"],
  ["/admin/review", "Jerin tantancewa"],
  ["/admin/comments", "Comments"],
  ["/admin/broadcast", "Live broadcast"],
  ["/admin/audio", "Radio & Podcasts"],
  ["/admin/marketing", "Audience & Advertising"],
  ["/admin/articles", "Labarai"],
  ["/admin/videos", "Bidiyo"],
  ["/admin/photos", "Photo stories"],
  ["/admin/categories", "Rukunin labarai"],
  ["/admin/staff", "Ma’aikata da izini"],
  ["/admin/settings", "Saitunan site"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  const pageName = pathname === "/admin"
    ? "Dashboard"
    : routeNames.find(([prefix]) => pathname.startsWith(prefix))?.[1] || "Newsroom";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <Image src="/k-tech-media-network.png" alt="K-TECH MEDIA NETWORK logo" width={44} height={44} className="admin-brand-logo" />
          <span><strong>K-TECH MEDIA NETWORK</strong><small>Connecting People Through Information.</small></span>
        </Link>
        <div className="admin-sidebar-scroll">
          {sections.map((section) => (
            <div className="admin-nav-section" key={section.label}>
              <div className="admin-nav-label">{section.label}</div>
              {section.links.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                return <Link href={item.href} key={item.href} className={`admin-nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                  <i className={`bi ${item.icon}`} aria-hidden="true" /><span>{item.label}</span>
                  {item.href === "/admin/review" && <i className="bi bi-arrow-up-right nav-link-tail" aria-hidden="true" />}
                </Link>;
              })}
            </div>
          ))}
        </div>
        <div className="admin-sidebar-bottom">
          <ThemeToggle />
          <Link href="/" className="admin-view-site"><i className="bi bi-box-arrow-up-right" aria-hidden="true" /> Duba website</Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-breadcrumb">NEWSROOM /</span><strong>{pageName}</strong></div>
          <div className="admin-topbar-actions"><Link href="/admin/articles/new" className="admin-create-link"><i className="bi bi-plus-lg" aria-hidden="true" /> Rubuta labari</Link><ThemeToggle compact /></div>
        </header>
        <div className="admin-workspace">{children}</div>
      </div>
    </div>
  );
}
