import { NextRequest, NextResponse } from "next/server";
import { RULE_TEMPLATES } from "@/lib/rule-engine";

// GET - List available rule templates
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      templates: Object.entries(RULE_TEMPLATES).map(([key, template]) => ({
        id: key,
        ...template,
      })),
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
