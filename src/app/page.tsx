"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Simple3DViewer } from "@/components/3d/model-3d-viewer";
import { Box, Settings, Mic, MicOff } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useModelStore } from "@/lib/stores/model-store";
import { Button } from "@/components/ui/button";
import { AnimationController } from "@/lib/services/animation-controller";
import { SettingsModal } from "@/components/settings/settings-modal";

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
  }
};

export default function Home() {
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 音声チャット関連の状態
  const [audioChatService, setAudioChatService] =
    useState<AudioChatIntegrationService | null>(null);
  const [status, setStatus] = useState<AudioChatStatus>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  // モデルストアからデフォルトモデル初期化関数を取得
  const {
    initializeDefaultModel,
    currentModel,
    getStorageStatus,
    forceInitialize,
  } = useModelStore();

  // 初期化処理
  useEffect(() => {
    // アニメーションコントローラーを初期化
    initializeAnimationController();
  }, []);

  // アプリケーション起動時にデフォルトモデルを初期化
  useEffect(() => {
    const initializeModel = async () => {
      console.log("🏠 ルートページ: モデル初期化開始");

      const status = getStorageStatus();
      console.log("📊 ストレージ状態:", status);

      if (!status.hasValidCurrentModel) {
        console.log("⚠️ 有効なcurrentModelが存在しません。初期化を実行します");
        await forceInitialize();
      } else {
        console.log("✅ 有効なcurrentModelが存在します");
      }
    };

    // 少し遅延させてストアの復元を待つ
    const timer = setTimeout(initializeModel, 200);

    return () => clearTimeout(timer);
  }, [initializeDefaultModel, getStorageStatus, forceInitialize]);

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
        setError(null);
      },
      onListeningEnd: () => {
        setIsListening(false);
      },
      onTranscriptReceived: (transcript: string, _isFinal: boolean) => {
        setCurrentTranscript(transcript);
      },
      onAIResponseReceived: (_response: string) => {},
      onSpeechStart: () => {},
      onSpeechEnd: () => {},
      onError: (error: AudioError) => {
        setError(error.message);
      },
      onStatusChange: (newStatus: AudioChatStatus) => {
        setStatus(newStatus);
      },
    }),
    []
  );

  // 音声チャットサービス初期化
  const initializeAudioChat = useCallback(async () => {
    try {
      // デバッグ: カスタムプロンプト設定を確認
      console.log("🔧 [Page Debug] 音声チャット初期化開始");
      
      const stored = localStorage.getItem("ai-settings");
      console.log("🔧 [Page Debug] localStorage 'ai-settings':", stored);
      
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          console.log("🔧 [Page Debug] 解析された設定:", settings);
          console.log("🔧 [Page Debug] カスタムプロンプト:", settings?.state?.customPrompt);
        } catch (e) {
          console.error("🔧 [Page Debug] 設定パースエラー:", e);
        }
      }

      const service = new AudioChatIntegrationService(defaultConfig, callbacks);
      const success = await service.startAudioChat();

      if (success) {
        setAudioChatService(service);
        setIsInitialized(true);
        setIsVoiceChatActive(true);
        setError(null);
        console.log("🔧 [Page Debug] 音声チャット初期化成功");
      } else {
        throw new Error("音声チャットの初期化に失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "初期化エラー";
      console.error("🔧 [Page Debug] 音声チャット初期化エラー:", err);
      setError(errorMessage);
    }
  }, [defaultConfig, callbacks]);

  // 音声チャット停止
  const stopAudioChat = useCallback(() => {
    if (audioChatService) {
      audioChatService.stopAudioChat();
      setIsInitialized(false);
      setIsVoiceChatActive(false);
      setIsListening(false);
      setCurrentTranscript("");
      setError(null);
    }
  }, [audioChatService]);

  // プッシュトゥトーク開始
  const startListening = useCallback(() => {
    if (audioChatService && status === "idle") {
      const success = audioChatService.startListening();
      if (!success) {
        setError("音声入力を開始できませんでした");
      }
    }
  }, [audioChatService, status]);

  // プッシュトゥトーク終了
  const stopListening = useCallback(() => {
    if (audioChatService && isListening) {
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

  // デバッグ用のグローバル関数を追加（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      (window as typeof window & { 
        __debugEchoes?: {
          checkCustomPrompt: () => unknown;
          testAudioChat: () => void;
        }
      }).__debugEchoes = {
        checkCustomPrompt: () => {
          const stored = localStorage.getItem("ai-settings");
          console.log("🔍 localStorage 'ai-settings':", stored);
          if (stored) {
            try {
              const settings = JSON.parse(stored);
              console.log("🔍 解析された設定:", settings);
              console.log("🔍 カスタムプロンプト:", settings?.state?.customPrompt);
              return settings?.state?.customPrompt;
            } catch (e) {
              console.error("🔍 パースエラー:", e);
              return null;
            }
          }
          return null;
        },
        testAudioChat: () => {
          console.log("🔍 音声チャットサービス:", audioChatService);
          console.log("🔍 初期化状態:", isInitialized);
          console.log("🔍 アクティブ状態:", isVoiceChatActive);
          console.log("🔍 ステータス:", status);
        }
      };
    }
  }, [audioChatService, isInitialized, isVoiceChatActive, status]);

  return (
    <main className="h-screen relative overflow-hidden">
      {/* 全画面3Dビューアー */}
      <div className="absolute inset-0 w-full h-full">
        <ErrorBoundary>
          <Simple3DViewer
            model={currentModel}
            className="w-full h-full"
            showInfo={false}
          />
        </ErrorBoundary>
      </div>

      {/* オーバーレイUI要素 */}
      {/* サイト名 - 左上 */}
      <div className="absolute top-8 left-8 z-30">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-100">echoes</h1>
        </div>
      </div>

      {/* 設定ボタン - 右上 */}
      <div className="absolute top-8 right-8 z-30">
        <Button
          variant="default"
          size="default"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-20">
          <div className="bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-lg p-3 shadow-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* 音声認識結果表示 */}
      {currentTranscript && (
        <div className="absolute top-20 left-8 right-8 z-20">
          <p className="text-sm text-white">{currentTranscript}</p>
        </div>
      )}

      {/* モデル読み込み案内（モデルが読み込まれていない場合） */}
      {!currentModel && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl text-center max-w-sm mx-4 border border-white/20">
            <Box className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              3Dモデルが必要です
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              3Dモデルを読み込んで
              <br />
              音声会話を始めましょう
            </p>
            <Button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              モデルを読み込む
            </Button>
            <div className="mt-3 text-xs text-gray-500">
              設定ページでVRM、glTF、GLBファイルを選択
            </div>
          </div>
        </div>
      )}

      {/* 音声操作UI - 下部中央オーバーレイ */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex flex-col items-center gap-3">
          {/* 音声チャット切り替えボタン */}
          <Button
            onClick={toggleVoiceChat}
            variant="outline"
            size="lg"
            className={`flex items-center gap-2 backdrop-blur-sm shadow-lg border ${
              isVoiceChatActive
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                : "bg-white/90 hover:bg-white/95 text-gray-900 border-white/20"
            }`}
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
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-white/20">
            {isVoiceChatActive ? (
              status === "listening" ? (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">録音中...</span>
                </div>
              ) : status === "processing" ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">AI処理中...</span>
                </div>
              ) : status === "speaking" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">音声再生中...</span>
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
      </div>

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </main>
  );
}
