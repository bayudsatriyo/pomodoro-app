import { NextRequest, NextResponse } from "next/server";
import { validateConfig } from "@/config";
import { getAIIntervention, parseAIResponse } from "@/lib/glm";
import type { InterventionType, PromptContext } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate configuration
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          error: `Missing environment variables: ${configValidation.missing.join(
            ", "
          )}`,
        },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { type, sessionCount, lastReminderTime, userPattern } = body as {
      type: InterventionType;
      sessionCount?: number;
      lastReminderTime?: string;
      userPattern?: string;
    };

    if (!type) {
      return NextResponse.json(
        { error: "Intervention type is required" },
        { status: 400 }
      );
    }

    // 3. Build context
    const context: PromptContext = {
      type,
      sessionCount,
      lastReminderTime,
      userPattern,
    };

    // 4. Get AI intervention
    const aiMessage = await getAIIntervention(context);
    const parsedMessage = parseAIResponse(aiMessage);

    // 5. Return response (AI memory logging is now done client-side via localStorage)
    return NextResponse.json({
      success: true,
      message: parsedMessage,
      type,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
