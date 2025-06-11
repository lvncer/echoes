import type {
  AIProviderConfig,
  AIRequest,
  AIResponse,
  AIError,
  AIProvider,
} from "../types/ai";
import { OpenAIService } from "./openai";

/**
 * AI サービス統合管理クラス
 */
export class AIService {
  private openaiService: OpenAIService | null = null;
  private currentConfig: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.currentConfig = config;
    this.initializeService();
  }

  /**
   * サービスを初期化
   */
  private initializeService(): void {
    switch (this.currentConfig.provider) {
      case "openai":
        this.openaiService = new OpenAIService(this.currentConfig);
        break;
      case "anthropic":
        // 将来実装
        console.warn("Anthropic はまだ実装されていません");
        break;
      case "local":
        // 将来実装
        console.warn("ローカル LLM はまだ実装されていません");
        break;
      default:
        throw new Error(
          `サポートされていないプロバイダー: ${this.currentConfig.provider}`
        );
    }
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: AIProviderConfig): void {
    this.currentConfig = newConfig;
    this.initializeService();
  }

  /**
   * 現在の設定を取得
   */
  public getCurrentConfig(): AIProviderConfig {
    return { ...this.currentConfig };
  }

  /**
   * AI 応答を生成
   */
  public async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      switch (this.currentConfig.provider) {
        case "openai":
          if (!this.openaiService) {
            throw this.createError(
              "SERVICE_NOT_INITIALIZED",
              "OpenAI サービスが初期化されていません"
            );
          }
          return await this.openaiService.generateResponse(request);

        case "anthropic":
          throw this.createError(
            "NOT_IMPLEMENTED",
            "Anthropic はまだ実装されていません"
          );

        case "local":
          throw this.createError(
            "NOT_IMPLEMENTED",
            "ローカル LLM はまだ実装されていません"
          );

        default:
          throw this.createError(
            "INVALID_PROVIDER",
            `無効なプロバイダー: ${this.currentConfig.provider}`
          );
      }
    } catch (error) {
      console.error("AI 応答生成エラー:", error);
      console.error("エラーの詳細:", JSON.stringify(error, null, 2));

      if (this.isAIError(error)) {
        throw error;
      }

      // エラーの詳細情報を取得
      let errorMessage = "AI 応答の生成に失敗しました";
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }

      throw this.createError("GENERATION_ERROR", errorMessage, error);
    }
  }

  /**
   * ストリーミング応答を生成
   */
  public async *generateStreamResponse(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    switch (this.currentConfig.provider) {
      case "openai":
        if (!this.openaiService) {
          throw this.createError(
            "SERVICE_NOT_INITIALIZED",
            "OpenAI サービスが初期化されていません"
          );
        }
        yield* this.openaiService.generateStreamResponse(request);
        break;

      case "anthropic":
        throw this.createError(
          "NOT_IMPLEMENTED",
          "Anthropic ストリーミングはまだ実装されていません"
        );

      case "local":
        throw this.createError(
          "NOT_IMPLEMENTED",
          "ローカル LLM ストリーミングはまだ実装されていません"
        );

      default:
        throw this.createError(
          "INVALID_PROVIDER",
          `無効なプロバイダー: ${this.currentConfig.provider}`
        );
    }
  }

  /**
   * 接続テスト
   */
  public async testConnection(): Promise<boolean> {
    try {
      switch (this.currentConfig.provider) {
        case "openai":
          return this.openaiService?.testConnection() ?? false;

        case "anthropic":
          // 将来実装
          return false;

        case "local":
          // 将来実装
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error("接続テストエラー:", error);
      return false;
    }
  }

  /**
   * 利用可能なモデル一覧を取得
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      switch (this.currentConfig.provider) {
        case "openai":
          return this.openaiService?.getAvailableModels() ?? [];

        case "anthropic":
          // 将来実装
          return ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"];

        case "local":
          // 将来実装
          return ["llama2", "codellama", "mistral"];

        default:
          return [];
      }
    } catch (error) {
      console.error("モデル一覧取得エラー:", error);
      return [];
    }
  }

  /**
   * プロバイダーが利用可能かチェック
   */
  public static isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case "openai":
        return true;
      case "anthropic":
      case "local":
        return false; // 将来実装
      default:
        return false;
    }
  }

  /**
   * サポートされているプロバイダー一覧を取得
   */
  public static getSupportedProviders(): AIProvider[] {
    return ["openai"]; // 将来的に 'anthropic', 'local' を追加
  }

  /**
   * エラーオブジェクトを作成
   */
  private createError(
    code: string,
    message: string,
    details?: unknown
  ): AIError {
    return {
      code,
      message,
      details,
    };
  }

  /**
   * AIError かどうかを判定
   */
  private isAIError(error: unknown): error is AIError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error
    );
  }
}
