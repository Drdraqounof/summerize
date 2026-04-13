import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/connect?google=missing-config", request.url));
  }

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get("google_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL(`/connect?google=error&reason=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/connect?google=invalid-state", request.url));
  }

  const redirectUri = `${request.nextUrl.origin}/api/google/callback`;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/connect?google=token-error", request.url));
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/connect?google=token-missing", request.url));
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: "no-store",
  });

  if (!userInfoResponse.ok) {
    return NextResponse.redirect(new URL("/connect?google=userinfo-error", request.url));
  }

  const userInfo = (await userInfoResponse.json()) as {
    email?: string;
    name?: string;
  };

  const redirect = new URL("/connect", request.url);
  redirect.searchParams.set("google", "connected");
  redirect.searchParams.set("provider", "gmail");

  if (userInfo.email) {
    redirect.searchParams.set("email", userInfo.email);
  }

  if (userInfo.name) {
    redirect.searchParams.set("name", userInfo.name);
  }

  const response = NextResponse.redirect(redirect);
  response.cookies.set("google_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}