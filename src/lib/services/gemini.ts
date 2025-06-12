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

      // 応答を生成
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

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
   * メッセージ履歴をGemini用のプロンプトに変換
   */
  private convertMessagesToPrompt(messages: ChatMessage[]): string {
    // システムプロンプトを追加（マークダウンなしの普通の文章で応答するよう指示）
    const systemPrompt = `
    あなたは親しみやすいAIアシスタントです。以下のルールに従って応答してください

    1. マークダウン記法（**太字**、*斜体*、# 見出し、- リスト、\`コード\`など）は一切使用しない
    2. 普通の文章のみで応答する
    3. 改行は自然な文章の区切りでのみ使用する
    4. 親しみやすく、自然な日本語で会話する
    5. 簡潔で分かりやすい回答を心がける
    `;

    const conversationHistory = messages
      .map((msg) => {
        const role = msg.role === "user" ? "ユーザー" : "アシスタント";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    return systemPrompt + conversationHistory + "\n\nアシスタント: ";
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
