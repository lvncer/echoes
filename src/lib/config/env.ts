import { z } from "zod";
import type { AIProviderConfig } from "../types/ai";

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-3.5-turbo"),
  OPENAI_MAX_TOKENS: z.string().default("1000").transform(Number),
  OPENAI_TEMPERATURE: z.string().default("0.7").transform(Number),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GEMINI_MAX_TOKENS: z.string().default("1000").transform(Number),
  GEMINI_TEMPERATURE: z.string().default("0.7").transform(Number),
  AI_PROVIDER: z
    .enum(["openai", "anthropic", "gemini", "local"])
    .default("gemini"),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
});

/**
 * 環境変数を検証して取得
 */
function getEnvConfig() {
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS,
    OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_MAX_TOKENS: process.env.GEMINI_MAX_TOKENS,
    GEMINI_TEMPERATURE: process.env.GEMINI_TEMPERATURE,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_BASE_URL: process.env.AI_BASE_URL,
  };

  try {
    const result = envSchema.parse(env);
    return result;
  } catch (error) {
    console.error("環境変数の設定に問題があります:", error);
    // デフォルト値で続行
    const defaultResult = envSchema.parse({});
    return defaultResult;
  }
}

/**
 * 環境変数から AI プロバイダー設定を生成
 */
export function createAIConfigFromEnv(): AIProviderConfig {
  const env = getEnvConfig();

  // プロバイダーに応じて設定を切り替え
  switch (env.AI_PROVIDER) {
    case "gemini":
      return {
        provider: "gemini",
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        maxTokens: env.GEMINI_MAX_TOKENS,
        temperature: env.GEMINI_TEMPERATURE,
      };
    case "openai":
      return {
        provider: "openai",
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.AI_BASE_URL,
        model: env.OPENAI_MODEL,
        maxTokens: env.OPENAI_MAX_TOKENS,
        temperature: env.OPENAI_TEMPERATURE,
      };
    default:
      // デフォルトはGemini
      return {
        provider: "gemini",
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        maxTokens: env.GEMINI_MAX_TOKENS,
        temperature: env.GEMINI_TEMPERATURE,
      };
  }
}

/**
 * デフォルトの AI 設定
 */
export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: "openai",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo",
  maxTokens: 1000,
  temperature: 0.7,
};

/**
 * 環境変数が設定されているかチェック
 */
export function validateEnvironment(): {
  isValid: boolean;
  missingVars: string[];
} {
  const missingVars: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missingVars.push("OPENAI_API_KEY");
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
