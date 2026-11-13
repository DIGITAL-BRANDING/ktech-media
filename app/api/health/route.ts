import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "media-platform",
    database: isSupabaseConfigured() ? "configured" : "not-configured",
  });
}
