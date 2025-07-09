/**
 * AI プロバイダーの種類
 */
export type AIProvider = "openai" | "anthropic" | "gemini" | "local";

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
 * カスタムプロンプト設定
 */
export interface CustomPromptSettings {
  /** カスタムプロンプトの有効/無効 */
  enabled: boolean;
  /** カスタムプロンプトの内容 */
  content: string;
  /** 最終更新日時 */
  lastUpdated: Date | string;
}

/**
 * AI 設定全体
 */
export interface AISettings {
  /** 現在のプロバイダー設定 */
  currentProvider: AIProviderConfig;
  /** 各プロバイダーの設定 */
  providers: {
    gemini: AIProviderConfig;
    openai: AIProviderConfig;
    anthropic: AIProviderConfig;
    local: AIProviderConfig;
  };
  /** カスタムプロンプト設定 */
  customPrompt: CustomPromptSettings;
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
  /** 音声メッセージフラグ */
  isVoice?: boolean;
  /** セッションID */
  sessionId?: string;
}

/**
 * チャット履歴セッション
 */
export interface ChatSession {
  /** セッションID */
  id: string;
  /** セッション名 */
  title: string;
  /** 開始時刻 */
  startedAt: Date;
  /** 最終更新時刻 */
  lastUpdatedAt: Date;
  /** メッセージ数 */
  messageCount: number;
  /** セッションの最初のメッセージ（タイトル生成用） */
  firstMessage?: string;
}

/**
 * チャット履歴フィルター
 */
export interface ChatHistoryFilter {
  /** 日付範囲 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 検索キーワード */
  searchQuery?: string;
  /** 音声メッセージのみ */
  voiceOnly?: boolean;
  /** セッションID */
  sessionId?: string;
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
