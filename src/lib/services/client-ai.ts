import type { ChatMessage, AIResponse } from "../types/ai";

/**
 * クライアントサイド用 AI サービス
 */
export class ClientAIService {
  /**
   * API Route経由でAI応答を生成
   */
  public async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API リクエストに失敗しました");
      }

      const data = await response.json();

      return {
        message: {
          ...data.message,
          timestamp: new Date(data.message.timestamp),
        },
        tokensUsed: data.tokensUsed,
        processingTime: data.processingTime,
      };
    } catch (error) {
      console.error("Client AI Service エラー:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("AI 応答の生成に失敗しました");
    }
  }

  /**
   * 接続テスト
   */
  public async testConnection(): Promise<boolean> {
    try {
      const testMessages: ChatMessage[] = [
        {
          id: "test",
          role: "user",
          content: "Hello",
          timestamp: new Date(),
        },
      ];

      await this.generateResponse(testMessages);
      return true;
    } catch {
      return false;
    }
  }
}
