"use client";

import { useTransition } from "react";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  function change(nextLocale: Locale) {
    startTransition(async () => {
      const response = await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      if (!response.ok) return;
      window.location.reload();
    });
  }
  return <div className={`language-switcher${compact ? " language-switcher-compact" : ""}`} role="group" aria-label="Choose language">
    <button type="button" onClick={() => change("en")} aria-pressed={locale === "en"} disabled={pending}>EN</button>
    <span aria-hidden="true">/</span>
    <button type="button" onClick={() => change("ha")} aria-pressed={locale === "ha"} disabled={pending}>HA</button>
  </div>;
}
