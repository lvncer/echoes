"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { ModelViewer } from "@/components/3d/model-viewer";
import { EmotionChat } from "@/components/chat/emotion-chat";
import { useEmotionStore } from "@/lib/stores/emotion-store";
import { useModelStore } from "@/lib/stores/model-store";
import { getEmotionBridge } from "@/lib/services/emotion-bridge";

/**
 * 統合感情チャットコンポーネント
 * 3Dモデル表示 + 感情チャット + Phase 2: 音声合成統合
 */
export function IntegratedEmotionChat() {
  const { currentEmotion, intensity, isProcessing } = useEmotionStore();
  const { currentModel } = useModelStore();

  // Phase 2: 音声合成統合状態
  const [speechIntegrationEnabled, setSpeechIntegrationEnabled] =
    useState(true);
  const [emotionBridgeState, setEmotionBridgeState] = useState(
    getEmotionBridge().getCurrentEmotionState()
  );

  // 感情ブリッジサービスの状態を定期的に更新
  useEffect(() => {
    const updateBridgeState = () => {
      setEmotionBridgeState(getEmotionBridge().getCurrentEmotionState());
    };

    const interval = setInterval(updateBridgeState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Phase 2: 音声統合機能の切り替え
  const toggleSpeechIntegration = () => {
    const newState = !speechIntegrationEnabled;
    setSpeechIntegrationEnabled(newState);
    getEmotionBridge().setSpeechIntegrationEnabled(newState);
  };

  // Phase 2: 音声キューのクリア
  const clearSpeechQueue = () => {
    getEmotionBridge().clearSpeechQueue();
  };

  // 感情の表示名を取得
  const getEmotionDisplayName = (emotion: string) => {
    const emotionNames: Record<string, string> = {
      neutral: "ニュートラル",
      happy: "喜び",
      sad: "悲しみ",
      angry: "怒り",
      surprised: "驚き",
    };
    return emotionNames[emotion] || emotion;
  };

  return (
    <div className="w-full h-screen flex">
      {/* 左側: 3Dモデル表示 */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 1.5, 3], fov: 50 }}
          style={{ background: "#f0f0f0" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          {currentModel && (
            <ModelViewer model={currentModel} animationSpeed={1} />
          )}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 1, 0]}
          />
          <Environment preset="studio" />
        </Canvas>

        {/* モデル情報オーバーレイ */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="w-64 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">モデル情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">モデル:</span>
                <Badge variant="outline" className="text-xs">
                  {currentModel?.name || "未読み込み"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">現在の感情:</span>
                <Badge
                  variant={
                    currentEmotion === "neutral" ? "secondary" : "default"
                  }
                  className="text-xs"
                >
                  {getEmotionDisplayName(currentEmotion)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">感情強度:</span>
                <span className="text-xs font-mono">
                  {(intensity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">処理状態:</span>
                <Badge
                  variant={isProcessing ? "destructive" : "default"}
                  className="text-xs"
                >
                  {isProcessing ? "処理中" : "待機中"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 2: 音声統合制御パネル */}
        <div className="absolute top-4 right-4 z-10">
          <Card className="w-80 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🔊 音声統合制御</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 音声統合有効/無効 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">音声統合:</span>
                <Button
                  size="sm"
                  variant={speechIntegrationEnabled ? "default" : "outline"}
                  onClick={toggleSpeechIntegration}
                  className="text-xs h-6"
                >
                  {speechIntegrationEnabled ? "有効" : "無効"}
                </Button>
              </div>

              {/* 音声キュー情報 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">音声キュー:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {emotionBridgeState.speechQueueLength}件
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSpeechQueue}
                    className="text-xs h-6"
                    disabled={emotionBridgeState.speechQueueLength === 0}
                  >
                    クリア
                  </Button>
                </div>
              </div>

              {/* 音声状態 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">音声状態:</span>
                <Badge
                  variant={
                    emotionBridgeState.isSpeaking ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {emotionBridgeState.isSpeaking ? "発話中" : "待機中"}
                </Badge>
              </div>

              <Separator />

              {/* 統合状態表示 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">感情連携:</span>
                  <Badge
                    variant={
                      emotionBridgeState.isEnabled ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {emotionBridgeState.isEnabled ? "有効" : "無効"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">音声連携:</span>
                  <Badge
                    variant={
                      emotionBridgeState.isSpeechIntegrationEnabled
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {emotionBridgeState.isSpeechIntegrationEnabled
                      ? "有効"
                      : "無効"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右側: チャット機能 */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">🎭 感情チャット</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI応答で感情表現と音声合成が連動します
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <EmotionChat />
        </div>
      </div>
    </div>
  );
}
