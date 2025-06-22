import { google } from "@ai-sdk/google";
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
  }

  private parseResponse(text: string) {
    const emotionRegex = /\[emotion:(\w+):(\d+\.?\d*)\]/g;
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
      // 有効な感情タイプのみを追加
      if (validEmotions.includes(emotionType as EmotionType)) {
        emotions.push({
          type: emotionType as EmotionType,
          intensity: parseFloat(match[2]),
        });
      }
      cleanText = cleanText.replace(match[0], "");
    }

    return {
      text: cleanText.trim(),
      emotions:
        emotions.length > 0 ? emotions : [{ type: "neutral", intensity: 0.5 }],
    };
  }
}
