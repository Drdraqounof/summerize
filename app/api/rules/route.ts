import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTaggedRules, syncFocusAreaRules } from "@/lib/focus-area-rules";
import { focusAreaOptions } from "@/lib/onboarding";

interface RuleBody {
  name: string;
  userEmail: string;
  enabled?: boolean;
  priority?: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
}

async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
}

// GET - List all rules for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    const user = await getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's focus areas
    const userPref = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { focusAreas: true },
    });

    const selectedFocusAreas = (userPref?.focusAreas || []).map((id: string) => {
      const option = focusAreaOptions.find((o) => o.id === id);
      return option ? { id, label: option.label } : null;
    }).filter(Boolean);

    // Auto-sync focus area rules if user has focus areas
    await syncFocusAreaRules(user.id);

    // Get tagged rules
    const rules = await getTaggedRules(user.id);

    return NextResponse.json({ rules, focusAreas: selectedFocusAreas });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST - Create new rule
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RuleBody;

    if (!body.userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    const user = await getUserByEmail(body.userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!body.name || !body.conditions || !body.actions) {
      return NextResponse.json(
        { error: "Missing required fields: name, conditions, actions" },
        { status: 400 }
      );
    }

    const rule = await prisma.customRule.create({
      data: {
        userId: user.id,
        name: body.name,
        isActive: body.enabled ?? true,
        conditions: body.conditions,
        actions: body.actions,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
