"use client";

import { useState, useEffect } from "react";
import { useAIStore } from "../stores/ai-store";
import type { ChatMessage } from "../lib/types/ai";

export default function Chat() {
  const [input, setInput] = useState("");
  const {
    messages,
    isLoading,
    settings,
    sendMessage,
    clearMessages,
    testConnection,
    initializeFromEnv,
  } = useAIStore();

  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  // 初期化
  useEffect(() => {
    initializeFromEnv();
  }, [initializeFromEnv]);

  // 接続テスト
  const handleTestConnection = async () => {
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? "connected" : "disconnected");
  };

  // メッセージ送信
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  // メッセージの表示
  const formatMessage = (message: ChatMessage) => {
    const timestamp = new Date(message.timestamp);
    const time = timestamp.toLocaleTimeString();
    const roleLabel = message.role === "user" ? "あなた" : "AI";

    return (
      <div
        key={message.id}
        className={`mb-4 p-3 rounded-lg ${
          message.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm">{roleLabel}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* ヘッダー */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Echoes AI Chat</h1>
            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                接続テスト
              </button>
              <button
                onClick={clearMessages}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                クリア
              </button>
            </div>
          </div>

          {/* 設定情報 */}
          <div className="mt-2 text-sm text-gray-600">
            <div>プロバイダー: {settings.currentProvider.provider}</div>
            <div>モデル: {settings.currentProvider.model}</div>
            <div>
              API キー: {settings.currentProvider.apiKey ? "設定済み" : "未設定"}
            </div>
            <div>
              接続状態:{" "}
              <span
                className={
                  connectionStatus === "connected"
                    ? "text-green-600"
                    : connectionStatus === "disconnected"
                    ? "text-red-600"
                    : "text-gray-600"
                }
              >
                {connectionStatus === "connected"
                  ? "接続済み"
                  : connectionStatus === "disconnected"
                  ? "未接続"
                  : "不明"}
              </span>
            </div>
          </div>
        </div>

        {/* メッセージ一覧 */}
        <div className="h-96 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>メッセージを送信してAIとの会話を開始してください。</p>
              <p className="text-sm mt-2">
                ※ OpenAI API キーが設定されている必要があります
              </p>
            </div>
          ) : (
            messages.map(formatMessage)
          )}

          {isLoading && (
            <div className="bg-gray-100 mr-8 p-3 rounded-lg mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                <span className="text-sm text-gray-600">
                  AI が応答を生成中...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
