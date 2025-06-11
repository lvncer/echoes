import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProviderConfig, ChatMessage, AIResponse } from "../types/ai";

/**
 * Google Gemini API サービス
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error("Gemini API キーが設定されていません");
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    console.log("Gemini クライアント初期化成功");
  }

  /**
   * AI 応答を生成
   */
  public async generateResponse(request: {
    messages: ChatMessage[];
    config?: Partial<AIProviderConfig>;
  }): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const config = { ...this.config, ...request.config };

      // Gemini用にメッセージを変換
      const prompt = this.convertMessagesToPrompt(request.messages);

      // モデルを取得
      const model = this.genAI.getGenerativeModel({
        model: config.model || "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
        },
      });

      console.log("Gemini API リクエスト開始:", {
        model: config.model,
        promptLength: prompt.length,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      });

      // 応答を生成
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      console.log("Gemini API レスポンス受信:", {
        responseLength: text.length,
        processingTime,
      });

      // レスポンスを構築
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: text,
        timestamp: new Date(),
      };

      return {
        message: aiMessage,
        tokensUsed: this.estimateTokens(prompt + text), // 概算
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      console.error("Gemini API エラー:", {
        error,
        processingTime,
        config: {
          model: this.config.model,
          hasApiKey: !!this.config.apiKey,
        },
      });

      if (error instanceof Error) {
        throw new Error(`Gemini API エラー: ${error.message}`);
      }

      throw new Error("Gemini API で不明なエラーが発生しました");
    }
  }

  /**
   * ChatMessageをGemini用のプロンプトに変換
   */
  private convertMessagesToPrompt(messages: ChatMessage[]): string {
    const conversationHistory = messages
      .map((message) => {
        const role = message.role === "user" ? "User" : "Assistant";
        return `${role}: ${message.content}`;
      })
      .join("\n\n");

    return conversationHistory;
  }

  /**
   * トークン数を概算（簡易実装）
   */
  private estimateTokens(text: string): number {
    // 簡易的な計算：4文字 ≈ 1トークン
    return Math.ceil(text.length / 4);
  }

  /**
   * 接続テスト
   */
  public async testConnection(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model || "gemini-1.5-flash",
      });

      const result = await model.generateContent("Hello");
      const response = await result.response;

      return !!response.text();
    } catch (error) {
      console.error("Gemini 接続テストエラー:", error);
      return false;
    }
  }
}
