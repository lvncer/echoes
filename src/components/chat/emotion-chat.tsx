"use client";

import { useState, useEffect } from "react";
import { generateEmotionalResponse } from "@/app/actions/emotion-actions";
import { useEmotionStore } from "@/lib/stores/emotion-store";
import { useAIStore } from "@/lib/stores/ai-store";
import { getEmotionBridge } from "@/lib/services/emotion-bridge";

/**
 * 感情チャットコンポーネント
 * Phase 3: エラーハンドリングとUX向上
 */
export function EmotionChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const { setEmotion, setProcessing, isProcessing, currentEmotion, intensity } = useEmotionStore();
  const { settings } = useAIStore();

  // Phase 3: エラー状態とUX改善
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // 感情ブリッジサービスの初期化
  useEffect(() => {
    getEmotionBridge(); // 初期化のみ実行

    return () => {
      // クリーンアップは必要に応じて実装
    };
  }, []);

  // 感情変化を監視して3Dアニメーションを実行
  useEffect(() => {
    const emotionBridge = getEmotionBridge();
    emotionBridge.handleEmotionChange(currentEmotion, intensity);
  }, [currentEmotion, intensity]);

  // Phase 3: エラーのクリア
  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  // Phase 3: 改善されたエラーハンドリング
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Prevent multiple submissions
    if (isProcessing) return;

    // エラーをクリア
    clearError();

    setMessages((prev) => [...prev, `You: ${input}`]);
    setProcessing(true);

    try {
      // カスタムプロンプト設定を取得
      const customPrompt = settings.customPrompt;

      const result = await generateEmotionalResponse(input, customPrompt);

      if (result.success && result.data) {
        const { text, emotions } = result.data;
        if (emotions && emotions.length > 0) {
          const emotion = emotions[0];
          setEmotion(emotion);

          // Phase 2: 音声合成統合機能を使用
          const emotionBridge = getEmotionBridge();
          await emotionBridge.handleAIResponseWithSpeech(text, emotion.type, emotion.intensity);
        }
        setMessages((prev) => [...prev, `AI: ${text}`]);

        // 成功時はリトライカウントをリセット
        setRetryCount(0);
      } else {
        throw new Error(result.error || "応答の生成に失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);

      // リトライ可能な場合の処理
      if (retryCount < maxRetries) {
        setMessages((prev) => [
          ...prev,
          `AI: エラーが発生しました (${retryCount + 1}/${maxRetries}回目)。再試行中...`,
        ]);

        // 2秒後に自動リトライ
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          handleSubmit(e);
        }, 2000);
      } else {
        setMessages((prev) => [
          ...prev,
          `AI: 申し訳ありません。複数回エラーが発生しました。しばらく待ってから再度お試しください。`,
        ]);
      }
    } finally {
      setProcessing(false);
      setInput("");
    }
  };

  // Phase 3: リトライ機能
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      clearError();
      const lastUserMessage = messages[messages.length - 2];
      if (lastUserMessage && lastUserMessage.startsWith("You: ")) {
        setInput(lastUserMessage.slice(5));
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* エラー表示 */}
      {error && (
        <div className="p-3 mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-red-800 font-medium">エラーが発生しました</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <div className="flex gap-2">
              {retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  再試行
                </button>
              )}
              <button onClick={clearError} className="text-xs text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* チャット履歴 */}
      <div
        className="flex-1 p-4 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="チャット履歴"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-8">
            <p>メッセージを送信して</p>
            <p>感情表現を確認してみましょう</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>感情表現 + 音声合成 + アイドル動作</p>
              <p>すべてが統合されて動作します</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.startsWith("You:");
          const isError = msg.includes("エラーが発生しました");
          return (
            <div
              key={`msg-${i}-${msg.slice(0, 10)}`}
              className={`mb-3 ${isUser ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  isUser
                    ? "bg-blue-500 text-white"
                    : isError
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {isUser ? msg.slice(5) : msg.slice(4)}
              </div>
            </div>
          );
        })}

        {/* 処理中インジケーター */}
        {isProcessing && (
          <div className="text-left mb-3">
            <div className="inline-block p-3 rounded-lg bg-gray-100 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span className="text-sm">AI応答生成中...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メッセージ入力 */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="メッセージを入力..."
            aria-label="チャットメッセージ入力"
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? "送信中..." : "送信"}
          </button>
        </form>

        {/* Phase 3: ヘルプテキスト */}
        <div className="mt-2 text-xs text-gray-500">
          💡 ヒント:
          感情的な言葉（嬉しい、悲しい、怒り、驚きなど）を使うと、より豊かな表現が楽しめます
        </div>
      </div>
    </div>
  );
}
