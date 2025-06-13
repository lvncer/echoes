"use client";

import { useState, useEffect } from "react";
import { Simple3DViewer } from "@/components/3d/model-3d-viewer";
import { Box, Settings, Mic, MicOff } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";
import { AnimationController } from "@/lib/services/animation-controller";
import Link from "next/link";

// アニメーションコントローラーの初期化
declare global {
  interface Window {
    __animationController?: AnimationController;
  }
}

const initializeAnimationController = () => {
  if (typeof window !== "undefined" && !window.__animationController) {
    window.__animationController = new AnimationController();
    console.log("🎭 アニメーションコントローラーを初期化しました");
  }
};

export default function Home() {
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // モデルストアからデフォルトモデル初期化関数を取得
  const { initializeDefaultModel, currentModel } = useModelStore();

  // 初期化処理
  useEffect(() => {
    // アニメーションコントローラーを初期化
    initializeAnimationController();
  }, []);

  // アプリケーション起動時にデフォルトモデルを初期化
  useEffect(() => {
    // 少し遅延させてストアの復元を待つ
    const timer = setTimeout(() => {
      console.log("デフォルトモデル初期化を実行");
      initializeDefaultModel();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeDefaultModel]);

  // Spaceキーでの音声入力制御
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat && isVoiceChatActive) {
        event.preventDefault();
        setIsRecording(true);
        console.log("🎤 録音開始 (Space key pressed)");
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isVoiceChatActive) {
        event.preventDefault();
        setIsRecording(false);
        console.log("🎤 録音終了 (Space key released)");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isVoiceChatActive]);

  const toggleVoiceChat = () => {
    setIsVoiceChatActive(!isVoiceChatActive);
    if (isRecording) {
      setIsRecording(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Echoes</h1>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                v1.0.0
              </span>
            </div>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                設定
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ: 3Dビューアー */}
      <div className="flex-1 relative min-h-0">
        <ErrorBoundary>
          <div className="w-full h-full">
            <Simple3DViewer
              model={currentModel}
              className="w-full h-full"
              showInfo={false}
            />
          </div>
        </ErrorBoundary>

        {/* モデル読み込み案内（モデルが読み込まれていない場合） */}
        {!currentModel && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 backdrop-blur-sm">
            <div className="bg-white/95 rounded-xl p-6 shadow-xl text-center max-w-sm mx-4 border border-gray-200">
              <Box className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                3Dモデルが必要です
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                3Dモデルを読み込んで
                <br />
                音声会話を始めましょう
              </p>
              <Link href="/settings">
                <Button className="w-full flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  モデルを読み込む
                </Button>
              </Link>
              <div className="mt-3 text-xs text-gray-500">
                設定ページでVRM、glTF、GLBファイルを選択
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 音声操作UI */}
      <footer className="bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* 音声チャット切り替えボタン */}
            <Button
              onClick={toggleVoiceChat}
              variant={isVoiceChatActive ? "default" : "outline"}
              size="lg"
              className="flex items-center gap-2"
            >
              {isVoiceChatActive ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
              {isVoiceChatActive ? "音声チャット ON" : "音声チャット OFF"}
            </Button>

            {/* 音声入力状態表示 */}
            <div className="flex items-center gap-2 min-w-[200px]">
              {isVoiceChatActive ? (
                isRecording ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">録音中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Spaceキーで話す</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <MicOff className="w-4 h-4" />
                  <span className="text-sm">音声チャット無効</span>
                </div>
              )}
            </div>
          </div>

          {/* 簡単な使い方説明 */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              3Dモデルと音声で会話できます •
              <Link
                href="/settings"
                className="text-blue-600 hover:underline ml-1"
              >
                詳細設定はこちら
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
