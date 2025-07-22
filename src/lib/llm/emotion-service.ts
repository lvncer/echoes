import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type EmotionType = "neutral" | "happy" | "sad" | "angry" | "surprised";

export interface EmotionTag {
  type: EmotionType;
  intensity: number; // 0.0 - 1.0
}

export class EmotionService {
  /**
   * カスタムプロンプト設定を取得
   */
  private getCustomPromptSettings() {
    // ブラウザ環境でのみlocalStorageから設定を取得
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ai-settings");
        if (!stored) return null;

        const settings = JSON.parse(stored);
        return settings?.state?.settings?.customPrompt || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async generateResponse(
    userInput: string,
    customPrompt?: { enabled: boolean; content: string }
  ): Promise<{
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

      // カスタムプロンプト設定を取得
      const customPromptSettings =
        customPrompt || this.getCustomPromptSettings();

      // システムプロンプトを構築
      let systemPrompt = `
        あなたは感情豊かなAIです。以下の感情タグを使って応答してください：
        [emotion:happy:0.8] - 喜び（強度0.8）
        [emotion:sad:0.6] - 悲しみ（強度0.6）

        利用可能な感情: neutral, happy, sad, angry, surprised
        文脈に応じて自然な感情を選択してください。
      `;

      // カスタムプロンプトが有効な場合は置き換える
      if (customPromptSettings?.enabled && customPromptSettings.content) {
        systemPrompt = `
        ${customPromptSettings.content}

        重要: 応答には必ず以下の感情タグを含めてください：
        [emotion:happy:0.8] - 喜び（強度0.8）
        [emotion:sad:0.6] - 悲しみ（強度0.6）

        利用可能な感情: neutral, happy, sad, angry, surprised
        キャラクターに合った感情を選択してください。
        `;
      }

      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
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
