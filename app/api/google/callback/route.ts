import { NextRequest, NextResponse } from "next/server";
import { storeToken } from "@/lib/tokenStore";
import { getAppUrl, getGoogleCallbackUrl } from "@/lib/app-url";
import { verifyGoogleOAuthState } from "@/lib/google-oauth-state";

// Google's OAuth token exchange endpoint
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
// Google's user info endpoint to get user details
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

/**
 * GET /api/google/callback
 * 
 * Callback endpoint that handles Google's OAuth redirect.
 * 
 * Flow:
 * 1. Receive authorization code and state from Google
 * 2. Verify state token matches what we sent (CSRF protection)
 * 3. Exchange code for access token
 * 4. Fetch user info from Google
 * 5. Save user to context and redirect to connected page
 */
export async function GET(request: NextRequest) {
  // Get configuration from environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/connect?google=missing-config", request.url));
  }

  // Extract OAuth parameters from Google's redirect
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get("google_oauth_state")?.value;
  const hasValidState = state ? verifyGoogleOAuthState(state) : false;

  // Log the redirect URI being used (for debugging)
  const redirectUri = getGoogleCallbackUrl(request);
  console.log("[Google Callback] Received request with redirect_uri:", redirectUri);
  console.log("[Google Callback] Parameters - state:", state, "code:", code?.substring(0, 10) + "...", "error:", error);

  // If Google sent an error, redirect to error page
  if (error) {
    console.error("[Google Callback] OAuth error from Google:", error);
    return NextResponse.redirect(new URL(`/connect?google=error&reason=${encodeURIComponent(error)}`, request.url));
  }

  // Verify state token matches to prevent CSRF attacks
  if (!code || !state || !hasValidState) {
    console.error("[Google Callback] State mismatch or missing code/state");
    console.log("[Google Callback] stored state:", storedState, "received state:", state, "code present:", !!code, "signed state valid:", hasValidState);
    return NextResponse.redirect(new URL("/connect?google=invalid-state", request.url));
  }

  if (!storedState) {
    console.warn("[Google Callback] Missing state cookie on callback; relying on signed state validation.");
  } else if (storedState !== state) {
    console.warn("[Google Callback] State cookie did not match callback state; relying on signed state validation.");
  }

  // Build the same redirect_uri that was sent in the initial request
  // This MUST match what was registered in Google Cloud Console
  // IMPORTANT: This must match EXACTLY what's in Google Cloud Console
  console.log("[Google Callback] Using redirect_uri for token exchange:", redirectUri);

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
    // Log detailed error information for debugging redirect_uri_mismatch
    const errorText = await tokenResponse.text();
    console.error("[Google Callback] Token exchange failed with status:", tokenResponse.status);
    console.error("[Google Callback] Error response:", errorText);
    // Check if the error is redirect_uri_mismatch (400 error)
    if (errorText.includes("redirect_uri_mismatch")) {
      console.error("[Google Callback] REDIRECT_URI_MISMATCH ERROR!");
      console.error("[Google Callback] The redirect_uri does not match what's registered in Google Cloud Console");
      console.error("[Google Callback] Redirect URI used:", redirectUri);
      console.error("[Google Callback] This must match EXACTLY in Google Cloud Console's OAuth credentials");
      return NextResponse.redirect(new URL(`/connect?google=redirect-mismatch&actual_uri=${encodeURIComponent(redirectUri)}`, request.url));
    }
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

  // Store the access token for this user (for now, in-memory)
  if (userInfo.email) {
    storeToken(userInfo.email, tokenData.access_token);
    console.log("[Google Callback] Stored access token for:", userInfo.email);
  }

  const redirect = new URL("/connect/complete", getAppUrl(request));
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