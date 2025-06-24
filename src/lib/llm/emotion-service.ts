import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type EmotionType = "neutral" | "happy" | "sad" | "angry" | "surprised";

export interface EmotionTag {
  type: EmotionType;
  intensity: number; // 0.0 - 1.0
}

export class EmotionService {
  async generateResponse(userInput: string): Promise<{
    text: string;
    emotions: EmotionTag[];
  }> {
    // 環境変数からAPIキーを取得
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Gemini API key is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable."
      );
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });

      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        system: `
        あなたは感情豊かなAIです。以下の感情タグを使って応答してください：
        [emotion:happy:0.8] - 喜び（強度0.8）
        [emotion:sad:0.6] - 悲しみ（強度0.6）

        利用可能な感情: neutral, happy, sad, angry, surprised
        文脈に応じて自然な感情を選択してください。
      `,
        prompt: userInput,
      });

      return this.parseResponse(text);
    } catch (_error) {
      throw new Error("Failed to generate emotional response");
    }
  }

  private parseResponse(text: string) {
    const emotionRegex = /\[emotion:([a-zA-Z]+):((?:0|1)(?:\.\d+)?)\]/g;
    const emotions: EmotionTag[] = [];
    let cleanText = text;

    const validEmotions: EmotionType[] = [
      "neutral",
      "happy",
      "sad",
      "angry",
      "surprised",
    ];

    let match;
    while ((match = emotionRegex.exec(text)) !== null) {
      const emotionType = match[1];
      const intensity = parseFloat(match[2]);

      // Validate intensity range
      if (isNaN(intensity) || intensity < 0 || intensity > 1) {
        cleanText = cleanText.replace(match[0], "");
        continue;
      }

      // 有効な感情タイプのみを追加
      if (validEmotions.includes(emotionType as EmotionType)) {
        emotions.push({
          type: emotionType as EmotionType,
          intensity,
        });
      }
      cleanText = cleanText.replace(match[0], "");
    }

    return {
      text: cleanText.trim(),
      emotions,
    };
  }
}
