import { NextRequest, NextResponse } from "next/server";
import { OpenAIService } from "../../../lib/services/openai";
import { GeminiService } from "../../../lib/services/gemini";
import { createAIConfigFromEnv } from "../../../lib/config/env";
import type { ChatMessage } from "../../../lib/types/ai";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "メッセージが無効です" },
        { status: 400 }
      );
    }

    // サーバーサイドで環境変数から設定を取得
    const config = createAIConfigFromEnv();

    if (!config.apiKey) {
      const providerName = config.provider === "gemini" ? "Gemini" : "OpenAI";
      return NextResponse.json(
        { error: `${providerName} API キーが設定されていません` },
        { status: 500 }
      );
    }

    // デモモード（環境変数で制御）
    const isDemoMode = process.env.AI_DEMO_MODE === "true";

    if (isDemoMode) {
      // モックレスポンスを返す
      const lastMessage = messages[messages.length - 1] as ChatMessage;
      const mockResponse = {
        message: {
          id: `ai_${Date.now()}`,
          role: "assistant" as const,
          content: `こんにちは！あなたのメッセージ「${lastMessage.content}」を受け取りました。現在はデモモードで動作しています。実際のAI機能を使用するには、OpenAI APIの設定を完了してください。`,
          timestamp: new Date(),
        },
        tokensUsed: 50,
        processingTime: 500,
      };

      return NextResponse.json(mockResponse);
    }

    // プロバイダーに応じてサービスを初期化
    let aiService;
    if (config.provider === "gemini") {
      aiService = new GeminiService(config);
    } else {
      aiService = new OpenAIService(config);
    }

    // AI 応答を生成
    const response = await aiService.generateResponse({
      messages: messages as ChatMessage[],
    });

    return NextResponse.json({
      message: response.message,
      tokensUsed: response.tokensUsed,
      processingTime: response.processingTime,
    });
  } catch (error) {
    console.error("Chat API エラー:", error);

    // クォータエラーの場合は分かりやすいメッセージを返す
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "insufficient_quota") {
        return NextResponse.json(
          {
            error:
              "OpenAI APIのクォータ制限に達しました。プランと請求情報を確認してください。",
            details:
              "https://platform.openai.com/usage でクォータ状況を確認できます。",
          },
          { status: 429 }
        );
      }
    }

    let errorMessage = "AI 応答の生成に失敗しました";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
