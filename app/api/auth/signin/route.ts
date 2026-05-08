import { NextRequest, NextResponse } from "next/server";
import { mapUserPreferenceToOnboardingAnswers } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
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

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Account not found." }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

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
    console.error("[Auth] Sign-in failed:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}