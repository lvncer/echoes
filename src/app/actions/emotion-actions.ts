"use server";

import { EmotionService } from "@/lib/llm/emotion-service";

const emotionService = new EmotionService();

export async function generateEmotionalResponse(
  userInput: string,
  customPrompt?: { enabled: boolean; content: string },
) {
  try {
    const result = await emotionService.generateResponse(userInput, customPrompt);
    return { success: true, data: result };
  } catch (_error) {
    return { success: false, error: "Failed to generate response" };
  }
}
