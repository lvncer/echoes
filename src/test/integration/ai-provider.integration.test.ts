import { describe, it, expect, beforeEach, vi } from "vitest";
import { GeminiService } from "../../lib/services/gemini";
import { OpenAIService } from "../../lib/services/openai";
import { useAIStore } from "../../stores/ai-store";
import type { AIProviderConfig, ChatMessage } from "../../lib/types/ai";

// AIサービスのモック
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => "Gemini response",
        },
      }),
    }),
  })),
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "OpenAI response",
              },
            },
          ],
          usage: {
            total_tokens: 50,
          },
        }),
      },
    },
  })),
}));

describe("AI Provider Integration Tests", () => {
  beforeEach(() => {
    // AIストアをリセット
    useAIStore.setState({
      settings: {
        currentProvider: {
          provider: "gemini",
          apiKey: "test-gemini-key",
          model: "gemini-1.5-flash",
          maxTokens: 1000,
          temperature: 0.7,
        },
        providers: {
          openai: {
            provider: "openai",
            apiKey: "test-openai-key",
            model: "gpt-3.5-turbo",
            maxTokens: 1000,
            temperature: 0.7,
          },
          gemini: {
            provider: "gemini",
            apiKey: "test-gemini-key",
            model: "gemini-1.5-flash",
            maxTokens: 1000,
            temperature: 0.7,
          },
          anthropic: {
            provider: "anthropic",
            baseUrl: "https://api.anthropic.com",
            model: "claude-3-haiku-20240307",
            maxTokens: 1000,
            temperature: 0.7,
          },
          local: {
            provider: "local",
            baseUrl: "http://localhost:11434",
            model: "llama2",
            maxTokens: 1000,
            temperature: 0.7,
          },
        },
      },
      aiService: null,
      messages: [],
      isLoading: false,
    });
  });

  describe("プロバイダー切り替え統合テスト", () => {
    it("Geminiプロバイダーでメッセージ送信が成功する", async () => {
      const store = useAIStore.getState();
      const geminiConfig = store.settings.providers.gemini!;
      const geminiService = new GeminiService(geminiConfig);

      const testMessages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "Hello Gemini",
          timestamp: new Date(),
        },
      ];

      const result = await geminiService.generateResponse({
        messages: testMessages,
      });

      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("Gemini response");
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("OpenAIプロバイダーでメッセージ送信が成功する", async () => {
      const store = useAIStore.getState();
      const openaiConfig = store.settings.providers.openai!;
      const openaiService = new OpenAIService(openaiConfig);

      const testMessages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "Hello OpenAI",
          timestamp: new Date(),
        },
      ];

      const result = await openaiService.generateResponse({
        messages: testMessages,
      });

      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("OpenAI response");
      expect(result.tokensUsed).toBe(50);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("プロバイダー切り替え後も正常に動作する", async () => {
      const store = useAIStore.getState();

      // 最初はGemini
      expect(store.settings.currentProvider.provider).toBe("gemini");
      const geminiService = new GeminiService(store.settings.providers.gemini!);

      const geminiResult = await geminiService.generateResponse({
        messages: [
          {
            id: "user-1",
            role: "user",
            content: "Test Gemini",
            timestamp: new Date(),
          },
        ],
      });

      expect(geminiResult.message.content).toBe("Gemini response");

      // OpenAIに切り替え
      useAIStore.getState().switchProvider("openai");
      const updatedStore = useAIStore.getState();
      expect(updatedStore.settings.currentProvider.provider).toBe("openai");

      const openaiService = new OpenAIService(
        updatedStore.settings.providers.openai!
      );
      const openaiResult = await openaiService.generateResponse({
        messages: [
          {
            id: "user-2",
            role: "user",
            content: "Test OpenAI",
            timestamp: new Date(),
          },
        ],
      });

      expect(openaiResult.message.content).toBe("OpenAI response");
    });
  });

  describe("設定管理統合テスト", () => {
    it("プロバイダー設定の更新が正しく反映される", () => {
      const store = useAIStore.getState();

      // Gemini設定を更新
      store.updateProviderConfig("gemini", {
        temperature: 0.9,
        maxTokens: 2000,
      });

      const updatedStore = useAIStore.getState();
      expect(updatedStore.settings.providers.gemini?.temperature).toBe(0.9);
      expect(updatedStore.settings.providers.gemini?.maxTokens).toBe(2000);
    });

    it("無効な設定でサービス初期化時にエラーが発生する", () => {
      const invalidConfig: AIProviderConfig = {
        provider: "gemini",
        apiKey: "", // 空のAPIキー
        model: "gemini-1.5-flash",
        maxTokens: 1000,
        temperature: 0.7,
      };

      expect(() => new GeminiService(invalidConfig)).toThrow(
        "Gemini API キーが設定されていません"
      );
    });
  });

  describe("エラーハンドリング統合テスト", () => {
    it("無効なAPIキーでサービス初期化時にエラーが発生する", () => {
      const invalidConfig: AIProviderConfig = {
        provider: "gemini",
        apiKey: "", // 空のAPIキー
        model: "gemini-1.5-flash",
        maxTokens: 1000,
        temperature: 0.7,
      };

      expect(() => new GeminiService(invalidConfig)).toThrow(
        "Gemini API キーが設定されていません"
      );
    });

    it("OpenAIサービスでも無効なAPIキーでエラーが発生する", async () => {
      const invalidConfig: AIProviderConfig = {
        provider: "openai",
        apiKey: "", // 空のAPIキー
        model: "gpt-3.5-turbo",
        maxTokens: 1000,
        temperature: 0.7,
      };

      const openaiService = new OpenAIService(invalidConfig);

      await expect(
        openaiService.generateResponse({
          messages: [
            {
              id: "test-1",
              role: "user",
              content: "Test",
              timestamp: new Date(),
            },
          ],
        })
      ).rejects.toThrow("OpenAI クライアントが初期化されていません");
    });
  });

  describe("メッセージ履歴統合テスト", () => {
    it("複数のメッセージ履歴を含む会話が正常に処理される", async () => {
      const store = useAIStore.getState();
      const geminiService = new GeminiService(store.settings.providers.gemini!);

      const conversationMessages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "こんにちは",
          timestamp: new Date(Date.now() - 60000),
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "こんにちは！何かお手伝いできることはありますか？",
          timestamp: new Date(Date.now() - 30000),
        },
        {
          id: "user-2",
          role: "user",
          content: "今日の天気について教えて",
          timestamp: new Date(),
        },
      ];

      const result = await geminiService.generateResponse({
        messages: conversationMessages,
      });

      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("Gemini response");
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it("空のメッセージ履歴でも正常に処理される", async () => {
      const store = useAIStore.getState();
      const geminiService = new GeminiService(store.settings.providers.gemini!);

      const result = await geminiService.generateResponse({
        messages: [],
      });

      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("Gemini response");
    });
  });

  describe("パフォーマンス統合テスト", () => {
    it("大量のメッセージ履歴でも適切な時間内で処理される", async () => {
      const store = useAIStore.getState();
      const geminiService = new GeminiService(store.settings.providers.gemini!);

      // 大量のメッセージ履歴を生成
      const largeMessageHistory: ChatMessage[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `msg-${i}`,
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i}`,
          timestamp: new Date(Date.now() - (100 - i) * 1000),
        })
      ) as ChatMessage[];

      const startTime = Date.now();
      const result = await geminiService.generateResponse({
        messages: largeMessageHistory,
      });
      const endTime = Date.now();

      expect(result.message.role).toBe("assistant");
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    });
  });
});
