"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CurrentNavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} className={`${className}${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>{children}</Link>;
}
