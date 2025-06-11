import { z } from "zod";
import type { AIProviderConfig } from "../types/ai";

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-3.5-turbo"),
  OPENAI_MAX_TOKENS: z.string().transform(Number).default(1000),
  OPENAI_TEMPERATURE: z.string().transform(Number).default(0.7),
  AI_PROVIDER: z.enum(["openai", "anthropic", "local"]).default("openai"),
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
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_BASE_URL: process.env.AI_BASE_URL,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error("環境変数の設定に問題があります:", error);
    // デフォルト値で続行
    return envSchema.parse({});
  }
}

/**
 * 環境変数から AI プロバイダー設定を生成
 */
export function createAIConfigFromEnv(): AIProviderConfig {
  const env = getEnvConfig();

  return {
    provider: env.AI_PROVIDER,
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.AI_BASE_URL,
    model: env.OPENAI_MODEL,
    maxTokens: env.OPENAI_MAX_TOKENS,
    temperature: env.OPENAI_TEMPERATURE,
  };
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
