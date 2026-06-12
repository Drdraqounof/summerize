import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
}

// GET - Fetch single rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();
    const { id } = await params;

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    const user = await getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rule = await prisma.customRule.findFirst({
      where: { id, userId: user.id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule" },
      { status: 500 }
    );
  }
}

// PATCH - Update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json()) as {
      userEmail?: string;
      name?: string;
      enabled?: boolean;
      priority?: number;
      conditions?: Record<string, unknown>;
      actions?: Record<string, unknown>;
    };
    const { id } = await params;

    if (!body.userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    const user = await getUserByEmail(body.userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rule = await prisma.customRule.findFirst({
      where: { id, userId: user.id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const updated = await prisma.customRule.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.enabled !== undefined && { isActive: body.enabled }),
        ...(body.conditions && { conditions: body.conditions }),
        ...(body.actions && { actions: body.actions }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

// DELETE - Remove rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();
    const { id } = await params;

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    const user = await getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rule = await prisma.customRule.findFirst({
      where: { id, userId: user.id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.customRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
