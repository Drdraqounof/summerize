import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const settings = await getNotificationSettings(email);

    if (!settings) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Notifications] Failed to fetch settings:", error);
    return NextResponse.json({ error: "Unable to fetch notification settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      notificationEnabled?: boolean;
      notificationFrequency?: string;
    };

    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const settings = await updateNotificationSettings({
      email,
      notificationEnabled: body.notificationEnabled,
      notificationFrequency: body.notificationFrequency,
    });

    if (!settings) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update notification settings.";
    const status = message.includes("Notification frequency") ? 400 : 500;
    console.error("[Notifications] Failed to update settings:", error);
    return NextResponse.json({ error: message }, { status });
  }
}