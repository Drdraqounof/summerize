import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { subject, preview, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Missing subject or body" },
        { status: 400 }
      );
    }

    const emailContent = `Subject: ${subject}\n\nPreview: ${preview}\n\nBody: ${body}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze email" },
      { status: 500 }
    );
  }
}
