import { config } from "@/config";
import {
  SYSTEM_PROMPT,
  POSTURE_VISION_PROMPT,
  generatePrompt,
  getStaticPrompt,
  type InterventionType,
  type PromptContext,
} from "./prompts";

interface GLMMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
}

interface GLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call GLM API for AI-generated intervention message
 */
export async function getAIIntervention(
  context: PromptContext
): Promise<string> {
  try {
    const messages: GLMMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: generatePrompt(context),
      },
    ];

    const requestBody = {
      model: "glm-4.7", // lowercase sesuai dokumentasi z.ai
      messages,
      temperature: 0.8,
      max_tokens: 500,
    };

    const response = await fetch(`${config.glm.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.glm.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GLM Chat] API error:", response.status, errorText);
      return getStaticPrompt(context.type);
    }

    const data: GLMResponse = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "";

    if (!aiMessage) {
      console.warn("[GLM Chat] No message in response, using static prompt");
      return getStaticPrompt(context.type);
    }

    return aiMessage.trim();
  } catch (error) {
    console.error("[GLM Chat] Exception:", error);
    return getStaticPrompt(context.type);
  }
}

/**
 * Analyze posture from image using GLM vision model
 */
export async function analyzePostureVision(imageUrl: string): Promise<string> {
  try {
    const messages = [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: POSTURE_VISION_PROMPT },
        ],
      },
    ];

    const requestBody = {
      model: "glm-4.6v",
      messages,
      temperature: 0.7, // higher for more natural, varied responses
      max_tokens: 200,
      thinking: {
        type: "disabled",
      },
    };

    // Vision uses CODING endpoint (for GLM Coding Plan)
    const generalEndpoint =
      "https://api.z.ai/api/coding/paas/v4/chat/completions";

    const response = await fetch(generalEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.glm.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GLM Vision] Error:", response.status, errorText);
      return "Tidak bisa menganalisis postur.";
    }

    const data: any = await response.json();

    // GLM-4.6V uses reasoning_content for thinking mode
    const aiMessage =
      data.choices?.[0]?.message?.reasoning_content ||
      data.choices?.[0]?.message?.content ||
      "";

    if (!aiMessage) {
      console.warn("[GLM Vision] Empty response");
      return "Tidak bisa menganalisis postur.";
    }

    return aiMessage.trim();
  } catch (error) {
    console.error("[GLM Vision] Exception:", error);
    return "Tidak bisa menganalisis postur.";
  }
}

/**
 * Parse markdown-style response if needed
 */
export function parseAIResponse(text: string): string {
  // Remove markdown formatting
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^#+\s/gm, "")
    .trim();
}
