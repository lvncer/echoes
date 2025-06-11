/**
 * AI プロバイダーの種類
 */
export type AIProvider = "openai" | "anthropic" | "local";

/**
 * AI プロバイダー設定
 */
export interface AIProviderConfig {
  /** プロバイダー名 */
  provider: AIProvider;
  /** API キー */
  apiKey?: string;
  /** ベース URL */
  baseUrl?: string;
  /** 使用するモデル名 */
  model: string;
  /** 最大トークン数 */
  maxTokens?: number;
  /** 温度パラメータ（0-1） */
  temperature?: number;
}

/**
 * AI 設定全体
 */
export interface AISettings {
  /** 現在のプロバイダー設定 */
  currentProvider: AIProviderConfig;
  /** 各プロバイダーの設定 */
  providers: {
    openai: AIProviderConfig;
    anthropic: AIProviderConfig;
    local: AIProviderConfig;
  };
}

/**
 * チャットメッセージ
 */
export interface ChatMessage {
  /** メッセージID */
  id: string;
  /** 送信者の役割 */
  role: "user" | "assistant" | "system";
  /** メッセージ内容 */
  content: string;
  /** 送信時刻 */
  timestamp: Date;
}

/**
 * AI 応答リクエスト
 */
export interface AIRequest {
  /** メッセージ履歴 */
  messages: ChatMessage[];
  /** プロバイダー設定（オプション） */
  config?: Partial<AIProviderConfig>;
}

/**
 * AI 応答レスポンス
 */
export interface AIResponse {
  /** 応答メッセージ */
  message: ChatMessage;
  /** 使用したトークン数 */
  tokensUsed?: number;
  /** 処理時間（ミリ秒） */
  processingTime?: number;
}

/**
 * AI エラー
 */
export interface AIError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details?: unknown;
}
