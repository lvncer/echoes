import OpenAI from "openai";
import type {
  AIProviderConfig,
  ChatMessage,
  AIRequest,
  AIResponse,
  AIError,
} from "../types/ai";

/**
 * OpenAI API クライアント
 */
export class OpenAIService {
  private client: OpenAI | null = null;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.initializeClient();
  }

  /**
   * クライアントを初期化
   */
  private initializeClient(): void {
    console.log("OpenAI クライアント初期化開始");
    console.log("設定:", {
      hasApiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length || 0,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
    });

    if (!this.config.apiKey) {
      console.warn("OpenAI API キーが設定されていません");
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
      });
      console.log("OpenAI クライアント初期化成功");
    } catch (error) {
      console.error("OpenAI クライアントの初期化に失敗しました:", error);
    }
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: AIProviderConfig): void {
    this.config = newConfig;
    this.initializeClient();
  }

  /**
   * AI 応答を生成
   */
  public async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw this.createError(
        "CLIENT_NOT_INITIALIZED",
        "OpenAI クライアントが初期化されていません"
      );
    }

    const startTime = Date.now();

    try {
      // ChatMessage を OpenAI の形式に変換
      const messages = request.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // 設定をマージ
      const config = { ...this.config, ...request.config };

      const completion = await this.client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw this.createError("NO_RESPONSE", "AI からの応答がありません");
      }

      const responseMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: "assistant",
        content: choice.message.content,
        timestamp: new Date(),
      };

      const processingTime = Date.now() - startTime;

      return {
        message: responseMessage,
        tokensUsed: completion.usage?.total_tokens,
        processingTime,
      };
    } catch (error) {
      console.error("OpenAI API エラー:", error);
      console.error("エラーの型:", typeof error);
      console.error("エラーの詳細:", JSON.stringify(error, null, 2));

      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        throw this.createError("API_ERROR", error.message, error);
      }

      throw this.createError(
        "UNKNOWN_ERROR",
        "不明なエラーが発生しました",
        error
      );
    }
  }

  /**
   * ストリーミング応答を生成（将来実装用）
   */
  public async *generateStreamResponse(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw this.createError(
        "CLIENT_NOT_INITIALIZED",
        "OpenAI クライアントが初期化されていません"
      );
    }

    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      const config = { ...this.config, ...request.config };

      const stream = await this.client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("OpenAI ストリーミング エラー:", error);
      throw this.createError(
        "STREAM_ERROR",
        "ストリーミング応答でエラーが発生しました",
        error
      );
    }
  }

  /**
   * 接続テスト
   */
  public async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const testRequest: AIRequest = {
        messages: [
          {
            id: "test",
            role: "user",
            content: "Hello",
            timestamp: new Date(),
          },
        ],
      };

      await this.generateResponse(testRequest);
      return true;
    } catch {
      return false;
    }
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
   * メッセージIDを生成
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 利用可能なモデル一覧を取得
   */
  public async getAvailableModels(): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const models = await this.client.models.list();
      return models.data
        .filter((model) => model.id.includes("gpt"))
        .map((model) => model.id)
        .sort();
    } catch (error) {
      console.error("モデル一覧の取得に失敗しました:", error);
      return ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"];
    }
  }
}
