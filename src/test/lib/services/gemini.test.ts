import { describe, it, expect, beforeEach, vi } from "vitest";
import { GeminiService } from "../../../lib/services/gemini";
import type { AIProviderConfig, ChatMessage } from "../../../lib/types/ai";

// Google Generative AIのモック
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

describe("GeminiService", () => {
  let geminiService: GeminiService;
  let mockConfig: AIProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: "gemini",
      apiKey: "test-api-key",
      model: "gemini-1.5-flash",
      maxTokens: 1000,
      temperature: 0.7,
    };

    geminiService = new GeminiService(mockConfig);
  });

  describe("初期化", () => {
    it("正常に初期化される", () => {
      expect(geminiService).toBeInstanceOf(GeminiService);
    });

    it("APIキーが未設定の場合はエラーを投げる", () => {
      const invalidConfig = { ...mockConfig, apiKey: undefined };

      expect(() => new GeminiService(invalidConfig)).toThrow(
        "Gemini API キーが設定されていません"
      );
    });
  });

  describe("generateResponse", () => {
    it("正常にAI応答を生成する", async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "Hello",
          timestamp: new Date(),
        },
      ];

      const mockResponse = {
        response: {
          text: () => "Hello! How can I help you?",
        },
      };

      // モックの設定
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      // プライベートプロパティへのアクセス
      Object.defineProperty(geminiService, "genAI", {
        value: { getGenerativeModel: mockGetGenerativeModel },
        writable: true,
      });

      const result = await geminiService.generateResponse({
        messages: mockMessages,
      });

      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("Hello! How can I help you?");
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(mockGenerateContent).toHaveBeenCalledWith("User: Hello");
    });

    it("APIエラーを適切にハンドリングする", async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "Hello",
          timestamp: new Date(),
        },
      ];

      const mockError = new Error("API Error");
      const mockGenerateContent = vi.fn().mockRejectedValue(mockError);
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      Object.defineProperty(geminiService, "genAI", {
        value: { getGenerativeModel: mockGetGenerativeModel },
        writable: true,
      });

      await expect(
        geminiService.generateResponse({ messages: mockMessages })
      ).rejects.toThrow("Gemini API エラー: API Error");
    });
  });

  describe("testConnection", () => {
    it("接続テストが成功する", async () => {
      const mockResponse = {
        response: {
          text: () => "Hello",
        },
      };

      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      Object.defineProperty(geminiService, "genAI", {
        value: { getGenerativeModel: mockGetGenerativeModel },
        writable: true,
      });

      const result = await geminiService.testConnection();

      expect(result).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith("Hello");
    });

    it("接続テストが失敗する", async () => {
      const mockGenerateContent = vi
        .fn()
        .mockRejectedValue(new Error("Connection failed"));
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      Object.defineProperty(geminiService, "genAI", {
        value: { getGenerativeModel: mockGetGenerativeModel },
        writable: true,
      });

      const result = await geminiService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("ユーティリティメソッド", () => {
    it("トークン数を正しく概算する", () => {
      // プライベートメソッドのテスト用にリフレクションを使用
      const estimateTokens = (
        geminiService as unknown as { estimateTokens: (text: string) => number }
      ).estimateTokens.bind(geminiService);

      expect(estimateTokens("Hello")).toBe(2); // 5文字 / 4 = 1.25 → 2
      expect(estimateTokens("Hello World")).toBe(3); // 11文字 / 4 = 2.75 → 3
      expect(estimateTokens("")).toBe(0);
    });

    it("メッセージを正しくプロンプトに変換する", () => {
      const messages: ChatMessage[] = [
        {
          id: "user-1",
          role: "user",
          content: "Hello",
          timestamp: new Date(),
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "Hi!",
          timestamp: new Date(),
        },
      ];

      // プライベートメソッドのテスト
      const convertMessagesToPrompt = (
        geminiService as unknown as {
          convertMessagesToPrompt: (messages: ChatMessage[]) => string;
        }
      ).convertMessagesToPrompt.bind(geminiService);
      const result = convertMessagesToPrompt(messages);

      expect(result).toBe("User: Hello\n\nAssistant: Hi!");
    });
  });
});
