"use server";

import { EmotionService } from "@/lib/llm/emotion-service";

const emotionService = new EmotionService();

export async function generateEmotionalResponse(userInput: string) {
  try {
    const result = await emotionService.generateResponse(userInput);
    return { success: true, data: result };
  } catch (_error) {
    return { success: false, error: "Failed to generate response" };
  }
}
