import { NextRequest, NextResponse } from "next/server";
import { getGoogleCallbackUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getGoogleCallbackUrl(request);
    return NextResponse.json({
      redirect_uri: redirectUri,
      app_url: process.env.APP_URL ?? null,
      google_client_id: process.env.GOOGLE_CLIENT_ID ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
