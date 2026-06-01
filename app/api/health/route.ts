import { NextResponse } from "next/server";

/**
 * GET /api/health
 * 
 * Health check endpoint that verifies all critical services are configured.
 * 
 * Use this endpoint to:
 * - Monitor if all API keys are properly set up
 * - Verify service worker can load
 * - Check the current server environment
 * - Debug configuration issues
 * 
 * Returns:
 * - Status 200: All critical services configured
 * - Status 500: One or more services not properly configured
 * 
 * Example response:
 * {
 *   "openai": "configured",
 *   "google": "configured",
 *   "googleSecret": "configured",
 *   "serviceWorker": "check in browser",
 *   "timestamp": "2026-04-22T10:30:00.000Z",
 *   "environment": "development"
 * }
 */
export async function GET() {
  try {
    // Check if all critical environment variables are set
    const checks = {
      // OpenAI API key for email analysis
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      // Google OAuth client ID for login
      google: process.env.GOOGLE_CLIENT_ID ? "configured" : "missing",
      // Google OAuth secret for backend communication
      googleSecret: process.env.GOOGLE_CLIENT_SECRET ? "configured" : "missing",
      // Resend API key for notification delivery
      resend: process.env.RESEND_API_KEY ? "configured" : "missing",
      // Resend sender email used for outbound digests
      resendFromEmail: process.env.RESEND_FROM_EMAIL ? "configured" : "missing",
      // Service worker can only be checked in browser
      serviceWorker: "check in browser",
      // Current server timestamp for debugging time-based issues
      timestamp: new Date().toISOString(),
      // Current environment (development or production)
      environment: process.env.NODE_ENV,
    };

    // Determine if all critical services are properly configured
    const allConfigured =
      checks.openai === "configured" &&
      checks.google === "configured" &&
      checks.googleSecret === "configured" &&
      checks.resend === "configured" &&
      checks.resendFromEmail === "configured";

    // Log the status check results for server debugging
    console.log("[Health] Status check:", checks);

    // Return 200 if all services configured, 500 if any are missing
    return NextResponse.json(checks, {
      status: allConfigured ? 200 : 500,
    });
  } catch (error) {
    // Catch any unexpected errors during health check
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Health] Check failed:", errorMsg);
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 }
    );
  }
}
