import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";

export function createUnsubscribeToken(id: string) {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set a 32-character NEWSLETTER_TOKEN_SECRET.");
  return createHmac("sha256", secret).update(`unsubscribe:${id}`).digest("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function makeRandomToken() {
  return randomUUID() + randomUUID();
}
