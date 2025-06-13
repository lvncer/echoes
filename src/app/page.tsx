"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Simple3DViewer } from "@/components/3d/model-3d-viewer";
import { Box, Settings, Mic, MicOff } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";
import { AnimationController } from "@/lib/services/animation-controller";
import Link from "next/link";

// カメラデバッグパネルコンポーネント
function CameraDebugPanel() {
  const { sceneConfig, resetToDefaults } = useModelStore();

  const handleResetSettings = () => {
    // ローカルストレージをクリア
    localStorage.removeItem("echoes-model-store");
    // 設定をデフォルトにリセット
    resetToDefaults();
    // ページをリロード
    window.location.reload();
  };

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-white/90 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="font-semibold mb-2">🎥 カメラ設定</div>
        <div>位置: [{sceneConfig.cameraPosition.join(", ")}]</div>
        <div>ターゲット: [{sceneConfig.cameraTarget.join(", ")}]</div>
        <div className="mt-2">
          <button
            onClick={handleResetSettings}
            className="text-blue-600 hover:text-blue-800 underline text-xs"
          >
            設定をリセット
          </button>
        </div>
        <div className="mt-1 text-gray-600">
          ブラウザの開発者ツールでログを確認
        </div>
      </div>
    </div>
  );
}
import {
  AudioChatIntegrationService,
  type AudioChatConfig,
  type AudioChatStatus,
  type AudioChatCallbacks,
} from "@/lib/services/audio-chat-integration";
import type { AudioError } from "@/lib/types/audio";

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

  // 音声チャット関連の状態
  const [audioChatService, setAudioChatService] =
    useState<AudioChatIntegrationService | null>(null);
  const [status, setStatus] = useState<AudioChatStatus>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

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

  // デフォルト音声チャット設定
  const defaultConfig: AudioChatConfig = useMemo(
    () => ({
      audioInput: {
        sampleRate: 44100,
        channelCount: 1,
      },
      speechRecognition: {
        language: "ja-JP",
        continuous: false,
        interimResults: true,
      },
      speechSynthesis: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
      aiResponse: {
        provider: "gemini",
        model: "gemini-1.5-flash",
        maxTokens: 1000,
        temperature: 0.7,
      },
    }),
    []
  );

  // 音声チャットコールバック設定
  const callbacks: AudioChatCallbacks = useMemo(
    () => ({
      onListeningStart: () => {
        setIsListening(true);
        setIsRecording(true);
        setError(null);
        console.log("🎤 音声入力開始");
      },
      onListeningEnd: () => {
        setIsListening(false);
        setIsRecording(false);
        console.log("🎤 音声入力終了");
      },
      onTranscriptReceived: (transcript: string, isFinal: boolean) => {
        setCurrentTranscript(transcript);
        if (isFinal) {
          console.log("📝 音声認識完了:", transcript);
        }
      },
      onAIResponseReceived: (response: string) => {
        console.log("🤖 AI応答受信:", response);
      },
      onSpeechStart: () => {
        console.log("🔊 音声合成開始");
      },
      onSpeechEnd: () => {
        console.log("🔊 音声合成終了");
      },
      onError: (error: AudioError) => {
        setError(error.message);
        console.error("❌ 音声チャットエラー:", error);
      },
      onStatusChange: (newStatus: AudioChatStatus) => {
        setStatus(newStatus);
        console.log("📊 ステータス変更:", newStatus);
      },
    }),
    []
  );

  // 音声チャットサービス初期化
  const initializeAudioChat = useCallback(async () => {
    try {
      console.log("🎤 音声チャットサービス初期化開始");
      const service = new AudioChatIntegrationService(defaultConfig, callbacks);
      const success = await service.startAudioChat();

      if (success) {
        setAudioChatService(service);
        setIsInitialized(true);
        setIsVoiceChatActive(true);
        setError(null);
        console.log("✅ 音声チャットサービス初期化完了");
      } else {
        throw new Error("音声チャットの初期化に失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "初期化エラー";
      setError(errorMessage);
      console.error("❌ 音声チャット初期化エラー:", err);
    }
  }, [defaultConfig, callbacks]);

  // 音声チャット停止
  const stopAudioChat = useCallback(() => {
    if (audioChatService) {
      console.log("🛑 音声チャットサービス停止");
      audioChatService.stopAudioChat();
      setIsInitialized(false);
      setIsVoiceChatActive(false);
      setIsListening(false);
      setIsRecording(false);
      setCurrentTranscript("");
      setError(null);
    }
  }, [audioChatService]);

  // プッシュトゥトーク開始
  const startListening = useCallback(() => {
    if (audioChatService && status === "idle") {
      console.log("🎤 プッシュトゥトーク開始");
      const success = audioChatService.startListening();
      if (!success) {
        setError("音声入力を開始できませんでした");
      }
    }
  }, [audioChatService, status]);

  // プッシュトゥトーク終了
  const stopListening = useCallback(() => {
    if (audioChatService && isListening) {
      console.log("🎤 プッシュトゥトーク終了");
      audioChatService.stopListening();
    }
  }, [audioChatService, isListening]);

  // 音声チャット切り替え
  const toggleVoiceChat = useCallback(() => {
    if (isVoiceChatActive && isInitialized) {
      stopAudioChat();
    } else {
      initializeAudioChat();
    }
  }, [isVoiceChatActive, isInitialized, stopAudioChat, initializeAudioChat]);

  // Spaceキーでの音声入力制御
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat && isInitialized) {
        event.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isInitialized) {
        event.preventDefault();
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInitialized, startListening, stopListening]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioChatService) {
        audioChatService.cleanup();
      }
    };
  }, [audioChatService]);

  return (
    <main className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
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
      <div className="flex-1 relative overflow-hidden">
        <ErrorBoundary>
          <Simple3DViewer
            model={currentModel}
            className="absolute inset-0 w-full h-full"
            showInfo={false}
          />
        </ErrorBoundary>

        {/* エラー表示 */}
        {error && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* カメラ位置デバッグパネル（開発環境のみ） */}
        {process.env.NODE_ENV === "development" && <CameraDebugPanel />}

        {/* 音声認識結果表示 */}
        {currentTranscript && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>認識中:</strong> {currentTranscript}
              </p>
            </div>
          </div>
        )}

        {/* モデル読み込み案内（モデルが読み込まれていない場合） */}
        {!currentModel && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 backdrop-blur-sm z-10">
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
      <footer className="bg-white border-t shadow-lg flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* 音声チャット切り替えボタン */}
            <Button
              onClick={toggleVoiceChat}
              variant={isVoiceChatActive ? "default" : "outline"}
              size="lg"
              className="flex items-center gap-2"
              disabled={status === "processing" || status === "speaking"}
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
                status === "listening" || isRecording ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">録音中...</span>
                            </div>
                ) : status === "processing" ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">AI処理中...</span>
                          </div>
                ) : status === "speaking" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">音声再生中...</span>
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
