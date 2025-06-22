"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useEmotionStore } from "@/lib/stores/emotion-store";
import { useModelStore } from "@/lib/stores/model-store";
import { generateEmotionalResponse } from "@/app/actions/emotion-actions";
import { EmotionDisplay } from "@/components/emotion/emotion-display";
import { ModelViewer } from "@/components/3d/model-viewer";
import { getEmotionBridge } from "@/lib/services/emotion-bridge";

export function IntegratedEmotionChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const { setEmotion, setProcessing, isProcessing, currentEmotion, intensity } =
    useEmotionStore();
  const { currentModel } = useModelStore();

  // 感情ブリッジサービスの初期化
  useEffect(() => {
    getEmotionBridge(); // 初期化のみ実行
    console.log("🌉 IntegratedEmotionChat: 感情ブリッジサービス初期化");

    return () => {
      // クリーンアップは必要に応じて実装
    };
  }, []);

  // 感情変化を監視して3Dアニメーションを実行
  useEffect(() => {
    const emotionBridge = getEmotionBridge();
    emotionBridge.handleEmotionChange(currentEmotion, intensity);
  }, [currentEmotion, intensity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Prevent multiple submissions
    if (isProcessing) return;

    setMessages((prev) => [...prev, `You: ${input}`]);
    setProcessing(true);

    const result = await generateEmotionalResponse(input);

    if (result.success && result.data) {
      const { text, emotions } = result.data;
      if (emotions && emotions.length > 0) {
        setEmotion(emotions[0]);
        console.log(
          `🎭 新しい感情設定: ${emotions[0].type} (強度: ${emotions[0].intensity})`
        );
      }
      setMessages((prev) => [...prev, `AI: ${text}`]);
    } else {
      setMessages((prev) => [
        ...prev,
        `AI: エラーが発生しました。もう一度お試しください。`,
      ]);
    }

    setProcessing(false);
    setInput("");
  };

  return (
    <div className="flex h-screen">
      {/* 左側: 3Dモデル表示 */}
      <div className="flex-1 relative">
        <Canvas
          camera={{
            position: [0, 1.5, 3],
            fov: 50,
          }}
          style={{ background: "#f0f0f0" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />

          {currentModel && (
            <ModelViewer model={currentModel} animationSpeed={1} />
          )}

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={10}
            target={[0, 1, 0]}
          />

          <Environment preset="studio" />
        </Canvas>

        {/* モデル情報オーバーレイ */}
        {currentModel && (
          <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm">
            <div className="font-semibold">{currentModel.name}</div>
            <div className="text-gray-300">
              {currentModel.format.toUpperCase()} •{" "}
              {(currentModel.size / 1024 / 1024).toFixed(1)}MB
            </div>
          </div>
        )}

        {/* 現在の感情状態表示 */}
        <div className="absolute top-4 right-4">
          <EmotionDisplay />
        </div>
      </div>

      {/* 右側: チャット機能 */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">感情チャット</h2>
          <p className="text-sm text-gray-600">
            AIと会話して3Dモデルの感情表現を確認
          </p>
        </div>

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
            </div>
          )}
          {messages.map((msg, i) => {
            const isUser = msg.startsWith("You:");
            return (
              <div
                key={`msg-${i}-${msg.slice(0, 10)}`}
                className={`mb-3 ${isUser ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    isUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isUser ? msg.slice(5) : msg.slice(4)}
                </div>
              </div>
            );
          })}
        </div>

        {/* メッセージ入力 */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="メッセージを入力..."
              aria-label="チャットメッセージ入力"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? "送信中..." : "送信"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
