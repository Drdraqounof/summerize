import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleCallbackUrl } from "@/lib/app-url";

// Google's OAuth authorization endpoint URL
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Health check to verify Google OAuth APIs are accessible
 * 
 * This prevents users from getting stuck on broken login screens
 * if Google's servers are down or unreachable. It performs a quick
 * check of Google's public configuration endpoint.
 * 
 * @returns Object with healthy flag and optional error message
 */
async function checkGoogleApiHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    // Create an abort controller to timeout requests that take too long
    const controller = new AbortController();
    // Kill the request if it takes longer than 5 seconds
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Query Google's public OpenID configuration endpoint
    // This is a fast way to verify Google's OAuth service is up
    const response = await fetch("https://accounts.google.com/.well-known/openid-configuration", {
      signal: controller.signal,
    });

    // Clear the timeout timer since the request completed
    clearTimeout(timeout);

    // Check if the response was successful (status 200-299)
    if (!response.ok) {
      return {
        healthy: false,
        error: `Google API returned status ${response.status}`,
      };
    }

    return { healthy: true };
  } catch (error) {
    // Log any errors that occurred during health check
    // This helps with debugging why Google auth might be failing
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn("[Google Auth] API health check failed:", errorMsg);
    return {
      healthy: false,
      error: `Health check failed: ${errorMsg}`,
    };
  }
}

/**
 * GET /api/google/auth
 * 
 * Initiates the Google OAuth login flow by redirecting to Google's authorization endpoint.
 * 
 * OAuth Flow:
 * 1. Validate configuration (client ID, environment)
 * 2. Check if Google APIs are reachable
 * 3. Generate random state token for CSRF protection
 * 4. Build authorization URL with required parameters
 * 5. Redirect user to Google login
 * 6. Store state token in secure cookie for verification later
 * 
 * @param request NextRequest from the user
 * @returns Redirect to Google or error response with status 500
 */
export async function GET(request: NextRequest) {
  try {
    // ============================================================
    // STEP 1: Verify required configuration is present
    // ============================================================
    // Get the Google Client ID from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Get the current environment (development or production)
    const nodeEnv = process.env.NODE_ENV;

    // If Google Client ID is missing, authentication is impossible
    if (!clientId) {
      console.error("[Google Auth] Missing GOOGLE_CLIENT_ID environment variable");
      return NextResponse.json(
        { error: "Google OAuth is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Check Google API health (logs warning but doesn't block auth flow)
    const healthCheck = await checkGoogleApiHealth();
    if (!healthCheck.healthy) {
      console.warn("[Google Auth] API health check failed:", healthCheck.error);
    }

    // ============================================================
    // STEP 3: Generate OAuth parameters
    // ============================================================
    // Extract the base URL (e.g., http://localhost:3000)
    const redirectUri = getGoogleCallbackUrl(request.url);
    // Generate a random token to prevent CSRF (Cross-Site Request Forgery) attacks
    const state = randomBytes(16).toString("hex");

    // ============================================================
    // STEP 4: Validate the redirect URI format
    // ============================================================
    // Ensures the redirect URI is a properly formatted URL
    try {
      new URL(redirectUri);
    } catch {
      console.error("[Google Auth] Invalid redirect URI format:", redirectUri);
      return NextResponse.json(
        { error: "Invalid configuration: redirect URI" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      // Our application's ID registered at Google
      client_id: clientId,
      // Where Google sends users after they authorize
      redirect_uri: redirectUri,
      // We want an authorization code (OAuth 2.0 standard)
      response_type: "code",
      // Scopes: permissions we're requesting from Google
      scope: [
        "openid", // Get OpenID Connect identity information
        "email", // Access user's email address
        "profile", // Access user's profile information
        "https://www.googleapis.com/auth/gmail.readonly", // Read-only Gmail access
      ].join(" "),
      // Request offline access to get refresh tokens
      access_type: "offline",
      // Show both consent and account selection screens
      prompt: "consent select_account",
      // Include CSRF protection token
      state,
    });

    // ============================================================
    // STEP 6: Build the complete authorization URL
    // ============================================================
    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    console.log("[Google Auth] Initiating OAuth flow");
    console.log("[Google Auth] Redirect URI being sent to Google:", redirectUri);

    // ============================================================
    // STEP 7: Create redirect response with secure cookie
    // ============================================================
    const response = NextResponse.redirect(authUrl);
    // Store the state token in a cookie to verify it matches when Google sends it back
    response.cookies.set("google_oauth_state", state, {
      httpOnly: true, // Only accessible from server (prevents XSS attacks)
      sameSite: "lax", // Only send with same-site requests (prevents CSRF)
      secure: nodeEnv === "production", // HTTPS only in production for security
      path: "/", // Cookie available on the entire domain
      maxAge: 60 * 10, // Expires in 10 minutes (enough time for authorization)
    });

    return response;
  } catch (error) {
    // Catch any unexpected errors that weren't handled above
    // Log full error details to help with debugging
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Google Auth] Unexpected error:", errorMsg, error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}