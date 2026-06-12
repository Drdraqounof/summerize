import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, type DashboardPeriod } from "@/lib/dashboard-stats";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();
    const period = (searchParams.get("period") as DashboardPeriod) || "week";

    if (!["week", "month", "all"].includes(period)) {
      return NextResponse.json(
        { error: "Period must be week, month, or all" },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const stats = await getDashboardStats(user.id, period);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Dashboard Stats] Error:", message, error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
