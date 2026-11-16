import { NextResponse } from "next/server";
import { z } from "zod";

const languageSchema = z.object({ locale: z.enum(["en", "ha"]) });

export async function POST(request: Request) {
  const parsed = languageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose English or Hausa." }, { status: 400 });

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set("site_locale", parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return response;
}
