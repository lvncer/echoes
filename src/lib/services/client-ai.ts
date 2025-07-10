import type { ChatMessage, AIResponse } from "../types/ai";
import { useAIStore } from "../stores/ai-store";

/**
 * クライアントサイド用 AI サービス
 */
export class ClientAIService {
  /**
   * API Route経由でAI応答を生成
   */
  public async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      // カスタムプロンプト設定を取得
      const customPromptSettings = this.getCustomPromptSettings();

      // sessionStorageからAI設定値を取得
      let aiConfig = undefined;
      if (typeof window !== "undefined") {
        aiConfig = {
          provider: sessionStorage.getItem("ENV_AI_PROVIDER") || undefined,
          apiKey:
            sessionStorage.getItem("ENV_AI_PROVIDER") === "openai"
              ? sessionStorage.getItem("ENV_OPENAI_API_KEY") || undefined
              : sessionStorage.getItem("ENV_AI_PROVIDER") === "gemini"
              ? sessionStorage.getItem("ENV_GEMINI_API_KEY") || undefined
              : undefined,
          model:
            sessionStorage.getItem("ENV_AI_PROVIDER") === "openai"
              ? sessionStorage.getItem("ENV_OPENAI_MODEL") || undefined
              : sessionStorage.getItem("ENV_AI_PROVIDER") === "gemini"
              ? sessionStorage.getItem("ENV_GEMINI_MODEL") || undefined
              : undefined,
          maxTokens:
            sessionStorage.getItem("ENV_AI_PROVIDER") === "openai"
              ? Number(sessionStorage.getItem("ENV_OPENAI_MAX_TOKENS")) || undefined
              : sessionStorage.getItem("ENV_AI_PROVIDER") === "gemini"
              ? Number(sessionStorage.getItem("ENV_GEMINI_MAX_TOKENS")) || undefined
              : undefined,
          temperature:
            sessionStorage.getItem("ENV_AI_PROVIDER") === "openai"
              ? Number(sessionStorage.getItem("ENV_OPENAI_TEMPERATURE")) || undefined
              : sessionStorage.getItem("ENV_AI_PROVIDER") === "gemini"
              ? Number(sessionStorage.getItem("ENV_GEMINI_TEMPERATURE")) || undefined
              : undefined,
          baseUrl:
            sessionStorage.getItem("ENV_AI_PROVIDER") === "openai" || sessionStorage.getItem("ENV_AI_PROVIDER") === "local"
              ? sessionStorage.getItem("ENV_AI_BASE_URL") || undefined
              : undefined,
        };
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          customPrompt: customPromptSettings,
          aiConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
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
      // ユーザーフレンドリーなエラーメッセージ
      let userMessage = "AI応答の生成に失敗しました。";

      if (error instanceof Error) {
        if (error.message.includes("クォータ制限")) {
          userMessage =
            "⚠️ APIのクォータ制限に達しました。しばらく時間をおいてからお試しください。";
        } else if (error.message.includes("API キー")) {
          userMessage =
            "⚠️ APIキーが設定されていません。設定を確認してください。";
        } else if (error.message.includes("HTTP 5")) {
          userMessage =
            "⚠️ サーバーエラーが発生しました。しばらく時間をおいてからお試しください。";
        } else if (
          error.message.includes("NetworkError") ||
          error.message.includes("fetch")
        ) {
          userMessage =
            "⚠️ ネットワークエラーが発生しました。接続を確認してください。";
        }
      }

      throw new Error(userMessage);
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

  /**
   * カスタムプロンプト設定を取得
   */
  private getCustomPromptSettings() {
    try {
      return useAIStore.getState().settings.customPrompt;
    } catch {
      // ストアが利用できない場合はデフォルト設定を返す
      return {
        enabled: false,
        content: "",
        lastUpdated: new Date(),
      };
    }
  }
}
