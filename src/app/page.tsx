"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Simple3DViewer } from "@/components/3d/model-3d-viewer";
import { Box, Settings, Mic, MicOff, MessageCircle, Lightbulb } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useModelStore } from "@/lib/stores/model-store";
import { Button } from "@/components/ui/button";
import { AnimationController } from "@/lib/services/animation-controller";
import { SettingsModal } from "@/components/settings/settings-modal";
import { ChatHistoryModal } from "@/components/chat-history/chat-history-modal";
import { MessageTemplatePanel } from "@/components/chat/message-template-panel";
import { TextChatInput } from "@/components/chat/text-chat-input";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
import {
  AudioChatIntegrationService,
  type AudioChatConfig,
  type AudioChatStatus,
  type AudioChatCallbacks,
} from "@/lib/services/audio-chat-integration";
import type { AudioError } from "@/lib/types/audio";
import { useAIStore } from "@/lib/stores/ai-store";

// アニメーションコントローラーの初期化
declare global {
  interface Window {
    __animationController?: AnimationController;
  }
}

const initializeAnimationController = () => {
  if (typeof window !== "undefined" && !window.__animationController) {
    window.__animationController = new AnimationController();

    // integratedLipSyncServiceにもアニメーションコントローラーを設定
    try {
      integratedLipSyncService.setAnimationController();
    } catch {}
  }
};

export default function Home() {
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  // 音声チャット関連の状態
  const [audioChatService, setAudioChatService] =
    useState<AudioChatIntegrationService | null>(null);
  const [status, setStatus] = useState<AudioChatStatus>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // モデルストアからデフォルトモデル初期化関数を取得
  const {
    initializeDefaultModel,
    currentModel,
    getStorageStatus,
    forceInitialize,
  } = useModelStore();

  // AIストアの初期化を必ず実行
  useEffect(() => {
    useAIStore.getState().initializeFromEnv();
  }, []);

  // 初期化処理
  useEffect(() => {
    // アニメーションコントローラーを初期化
    initializeAnimationController();
  }, []);

  // アプリケーション起動時にデフォルトモデルを初期化
  useEffect(() => {
    const initializeModel = async () => {
      const status = getStorageStatus();

      if (!status.hasValidCurrentModel) {
        await forceInitialize();
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
        model: "gemini-2.0-flash",
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
      const stored = localStorage.getItem("ai-settings");

      if (stored) {
        try {
          JSON.parse(stored);
        } catch {}
      }

      const service = new AudioChatIntegrationService(defaultConfig, callbacks);
      const success = await service.startAudioChat();

      if (success) {
        setAudioChatService(service);
        setIsInitialized(true);
        setIsVoiceChatActive(true);
        setError(null);
      } else {
        throw new Error("音声チャットの初期化に失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "初期化エラー";
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

  // テンプレートメッセージ処理
  const handleTemplateMessage = useCallback(async (message: string) => {
    if (!audioChatService) {
      // 音声チャットが初期化されていない場合は初期化してから実行
      try {
        const service = new AudioChatIntegrationService(defaultConfig, callbacks);
        const success = await service.startAudioChat();
        
        if (success) {
          setAudioChatService(service);
          setIsInitialized(true);
          setIsVoiceChatActive(true);
          setError(null);
          
          // テンプレートメッセージを処理
          await service.processTemplateMessage(message);
        } else {
          setError("音声チャットの初期化に失敗しました");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "初期化エラー";
        setError(errorMessage);
      }
    } else if (isInitialized) {
      // 既に初期化されている場合は直接処理
      const success = await audioChatService.processTemplateMessage(message);
      if (!success) {
        setError("テンプレートメッセージの処理に失敗しました");
      }
    }
  }, [audioChatService, isInitialized, defaultConfig, callbacks]);

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
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      (
        window as typeof window & {
          __debugEchoes?: {
            checkCustomPrompt: () => unknown;
            testAudioChat: () => void;
          };
        }
      ).__debugEchoes = {
        checkCustomPrompt: () => {
          const stored = localStorage.getItem("ai-settings");
          if (stored) {
            try {
              const settings = JSON.parse(stored);
              return settings?.state?.customPrompt;
            } catch {
              return null;
            }
          }
          return null;
        },
        testAudioChat: () => {},
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

      {/* チャット履歴・テンプレート・設定ボタン - 右上 */}
      <div className="absolute top-8 right-8 z-30 flex gap-3">
        <Button
          variant="default"
          size="default"
          onClick={() => setIsChatHistoryOpen(true)}
          className="flex items-center gap-2 cursor-pointer bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-xl border border-gray-600/30 shadow-lg"
        >
          <MessageCircle className="w-4 h-4 text-white" />
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={() => setIsTemplateOpen(!isTemplateOpen)}
          className={`flex items-center gap-2 cursor-pointer backdrop-blur-xl border shadow-lg transition-colors duration-200 ${
            isTemplateOpen
              ? "bg-yellow-600/90 hover:bg-yellow-700/90 border-yellow-500/30"
              : "bg-gray-800/90 hover:bg-gray-700/90 border-gray-600/30"
          }`}
        >
          <Lightbulb className={`w-4 h-4 ${isTemplateOpen ? "text-yellow-100" : "text-white"}`} />
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 cursor-pointer bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-xl border border-gray-600/30 shadow-lg"
        >
          <Settings className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-20">
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 shadow-xl">
            <p className="text-sm text-red-100 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* モデル読み込み案内（モデルが読み込まれていない場合） */}
      {!currentModel && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-lg z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 border border-white/20">
            <Box className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-3">
              3Dモデルが必要です
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              3Dモデルを読み込んで
              <br />
              音声会話を始めましょう
            </p>
            <Button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2 bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm border border-blue-500/30"
            >
              <Settings className="w-4 h-4" />
              モデルを読み込む
            </Button>
            <div className="mt-4 text-xs text-gray-400">
              設定ページでVRM、glTF、GLBファイルを選択
            </div>
          </div>
        </div>
      )}

      {/* 操作UIコンテナ - 下部中央 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-4">
          {/* テキストチャット入力 */}
          <TextChatInput
            isVoiceChatActive={isVoiceChatActive}
            voiceChatStatus={status}
          />

          {/* 統合されたマイクボタン */}
          <Button
            onClick={toggleVoiceChat}
            variant="outline"
            size="lg"
            className={`
              relative w-16 h-16 rounded-full backdrop-blur-xl shadow-2xl border-2 transition-all duration-300 cursor-pointer
              ${
                isVoiceChatActive
                  ? status === "listening"
                    ? "bg-red-500/90 hover:bg-red-600/90 border-red-400/50 shadow-red-500/50"
                    : status === "processing"
                    ? "bg-yellow-500/90 hover:bg-yellow-600/90 border-yellow-400/50 shadow-yellow-500/50 animate-pulse"
                    : status === "speaking"
                    ? "bg-green-500/90 hover:bg-green-600/90 border-green-400/50 shadow-green-500/50 animate-pulse"
                    : "bg-blue-500/90 hover:bg-blue-600/90 border-blue-400/50 shadow-blue-500/50"
                  : "bg-gray-800/90 hover:bg-gray-700/90 border-gray-600/50 shadow-gray-800/50"
              }
            `}
            disabled={status === "processing" || status === "speaking"}
          >
            {isVoiceChatActive ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <MicOff className="w-8 h-8 text-white" />
            )}
          </Button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <ChatHistoryModal
        open={isChatHistoryOpen}
        onOpenChange={setIsChatHistoryOpen}
      />
      <MessageTemplatePanel
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        onTemplateSelect={handleTemplateMessage}
      />
    </main>
  );
}
