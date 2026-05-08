import { NextRequest, NextResponse } from "next/server";
import { type OnboardingAnswers } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, answers } = (await request.json()) as {
      email?: string;
      answers?: OnboardingAnswers;
    };

    const normalizedEmail = email?.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !answers?.hasUsedAiBefore ||
      answers.selectedFocusAreas.length === 0 ||
      !answers.assistantStyle ||
      !answers.notificationFrequency
    ) {
      return NextResponse.json({ error: "Missing onboarding data." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          upsert: {
            create: {
              onboardingCompleted: true,
              hasUsedAiBefore: answers.hasUsedAiBefore,
              focusAreas: answers.selectedFocusAreas,
              assistantStyle: answers.assistantStyle,
              notificationFrequency: answers.notificationFrequency,
            },
            update: {
              onboardingCompleted: true,
              hasUsedAiBefore: answers.hasUsedAiBefore,
              focusAreas: answers.selectedFocusAreas,
              assistantStyle: answers.assistantStyle,
              notificationFrequency: answers.notificationFrequency,
            },
          },
        },
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[Onboarding] Save failed:", error);
    return NextResponse.json({ error: "Unable to save onboarding answers." }, { status: 500 });
  }
}