import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { subject, preview, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Missing subject or body" },
        { status: 400 }
      );
    }

    const emailContent = `Subject: ${subject}\n\nPreview: ${preview}\n\nBody: ${body}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-instruct",
      messages: [
        {
          role: "system",
          content: `You are an email analyzer. Analyze emails and respond with ONLY valid JSON (no extra text):
{
  "category": "Work|Personal|Promotions|Alerts|Other",
  "summary": "brief summary in max 100 chars"
}

Categories:
- Work: Professional, meetings, work updates
- Personal: Friends, family, personal matters
- Promotions: Marketing, sales, newsletters, discounts
- Alerts: Notifications, confirmations, alerts
- Other: Miscellaneous`,
        },
        {
          role: "user",
          content: `Analyze this email:\n\n${emailContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      category: result.category,
      summary: result.summary,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email analysis error:", errorMessage, error);
    return NextResponse.json(
      { error: `Failed to analyze email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
