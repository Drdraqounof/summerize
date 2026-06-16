import { NextRequest, NextResponse } from "next/server";
import { mapUserPreferenceToOnboardingAnswers } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/google-signin
 * 
 * Handles authentication after successful Google OAuth.
 * 
 * Flow:
 * 1. Receive Google user info (email, name)
 * 2. Find or create user in database
 * 3. Return user data for client-side session setup
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name } = (await request.json()) as {
      email?: string;
      name?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: {
          select: {
            onboardingCompleted: true,
            hasUsedAiBefore: true,
            focusAreas: true,
            assistantStyle: true,
            notificationFrequency: true,
          },
        },
      },
    });

    // If user doesn't exist, create new one for Gmail OAuth
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || undefined,
          // Google OAuth users don't have passwords
          // They're marked as such so they can't log in with email/password
        },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: {
            select: {
              onboardingCompleted: true,
              hasUsedAiBefore: true,
              focusAreas: true,
              assistantStyle: true,
              notificationFrequency: true,
            },
          },
        },
      });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      onboardingAnswers: mapUserPreferenceToOnboardingAnswers(user.preferences),
      hasCompletedOnboarding: user.preferences?.onboardingCompleted ?? false,
    });
  } catch (error) {
    console.error("[Google Auth] Sign-in failed:", error);
    return NextResponse.json(
      { error: "Unable to sign in with Google right now." },
      { status: 500 }
    );
  }
}
