"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

function decodeKey(value: string) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function WebPushSubscribe({ locale }: { locale: Locale }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function toggle() {
    setPending(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error(locale === "ha" ? "Wannan browser bai tallafa wa sanarwar web push ba." : "This browser does not support web push notifications.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error(locale === "ha" ? "An hana izinin sanarwa." : "Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
        setMessage(locale === "ha" ? "An kashe sanarwar." : "Notifications are turned off.");
      } else {
        const keyResponse = await fetch("/api/push/subscribe");
        const { publicKey } = await keyResponse.json() as { publicKey?: string };
        if (!keyResponse.ok || !publicKey) throw new Error(locale === "ha" ? "Ba a saita sanarwar ba tukuna." : "Push notifications are not configured yet.");
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
        const saved = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON(), language: locale }) });
        if (!saved.ok) { await subscription.unsubscribe(); throw new Error(locale === "ha" ? "An kasa kunna sanarwar." : "Could not enable notifications."); }
        setMessage(locale === "ha" ? "An kunna sanarwar labarai." : "Breaking news notifications are on.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update notification settings.");
    } finally { setPending(false); }
  }
  return <div className="push-subscribe"><button className="btn-waraka-outline" type="button" onClick={toggle} disabled={pending}>{pending ? "…" : locale === "ha" ? "Kunna sanarwar labarai" : "Get breaking news alerts"}</button><small aria-live="polite">{message}</small></div>;
}
