"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", { method: "POST", body: data });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not subscribe.");
      setMessage(result.message || (locale === "ha" ? "Duba imel ɗinka domin tabbatarwa." : "Check your email to confirm your subscription."));
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not subscribe.");
    } finally {
      setPending(false);
    }
  }
  return <form className="newsletter-form" onSubmit={submit}>
    <label className="visually-hidden" htmlFor="newsletter-email">{locale === "ha" ? "Adireshin imel" : "Email address"}</label>
    <input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder={locale === "ha" ? "Adireshin imel ɗinka" : "Your email address"} />
    <input type="hidden" name="language" value={locale} />
    <label className="newsletter-consent"><input type="checkbox" name="consent" value="yes" required />{locale === "ha" ? "Na yarda a aika mini da sabbin labarai ta imel." : "I agree to receive email news updates."}</label>
    <label className="newsletter-honeypot" aria-hidden="true">Leave this field blank<input name="company" tabIndex={-1} autoComplete="off" /></label>
    <button type="submit" disabled={pending}>{pending ? "…" : locale === "ha" ? "Yi rajista" : "Subscribe"}</button>
    <small aria-live="polite">{message || (locale === "ha" ? "Za ka iya cire rajista a kowane lokaci." : "No spam. Unsubscribe at any time.")}</small>
  </form>;
}
