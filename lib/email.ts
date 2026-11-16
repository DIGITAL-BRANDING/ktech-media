import "server-only";

export async function sendTransactionalEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and NEWSLETTER_FROM_EMAIL are required to send email.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}

export async function sendEmailBatch(inputs: Array<{ to: string; subject: string; html: string }>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and NEWSLETTER_FROM_EMAIL are required to send email.");
  if (!inputs.length || inputs.length > 100) throw new Error("Email batches must contain 1 to 100 messages.");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(inputs.map((email) => ({ from, ...email }))),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email batch delivery failed (${response.status}).`);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}
