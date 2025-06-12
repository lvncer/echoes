"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Mic, MicOff, VolumeX, Smile } from "lucide-react";
import {
  AudioChatIntegrationService,
  type AudioChatConfig,
  type AudioChatStatus,
  type AudioChatCallbacks,
} from "@/lib/services/audio-chat-integration";
import type { AudioError } from "@/lib/types/audio";

interface AudioChatControlsProps {
  onTranscriptReceived?: (transcript: string, isFinal: boolean) => void;
  onAIResponseReceived?: (response: string) => void;
  className?: string;
}

export function AudioChatControls({
  onTranscriptReceived,
  onAIResponseReceived,
  className = "",
}: AudioChatControlsProps) {
  const [audioChatService, setAudioChatService] =
    useState<AudioChatIntegrationService | null>(null);
  const [status, setStatus] = useState<AudioChatStatus>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);

  // デフォルト設定（useMemoで最適化）
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

  // コールバック設定（useMemoで最適化）
  const callbacks: AudioChatCallbacks = useMemo(
    () => ({
      onListeningStart: () => {
        setIsListening(true);
        setError(null);
      },
      onListeningEnd: () => {
        setIsListening(false);
      },
      onTranscriptReceived: (transcript: string, isFinal: boolean) => {
        setCurrentTranscript(transcript);
        onTranscriptReceived?.(transcript, isFinal);
      },
      onAIResponseReceived: (response: string) => {
        onAIResponseReceived?.(response);
      },
      onSpeechStart: () => {
        // 音声合成開始時の処理 - リップシンク開始
        if (lipSyncEnabled) {
          // TTS音声開始時は統合リップシンクサービスが自動で処理
          console.log("TTS音声開始 - リップシンク連動");
        }
      },
      onSpeechEnd: () => {
        // 音声合成終了時の処理 - リップシンク停止
        if (lipSyncEnabled) {
          // TTS音声終了時は統合リップシンクサービスが自動で処理
          console.log("TTS音声終了 - リップシンク停止");
        }
      },
      onError: (error: AudioError) => {
        setError(error.message);
        console.error("音声チャットエラー:", error);
      },
      onStatusChange: (newStatus: AudioChatStatus) => {
        setStatus(newStatus);
      },
    }),
    [onTranscriptReceived, onAIResponseReceived, lipSyncEnabled]
  );

  // 音声チャットサービス初期化
  const initializeAudioChat = useCallback(async () => {
    try {
      const service = new AudioChatIntegrationService(defaultConfig, callbacks);
      const success = await service.startAudioChat();

      if (success) {
        setAudioChatService(service);
        setIsInitialized(true);
        setAvailableVoices(service.getAvailableVoices());
        setError(null);
      } else {
        setError("音声チャットの初期化に失敗しました");
      }
    } catch (err) {
      setError(`初期化エラー: ${err}`);
    }
  }, [defaultConfig, callbacks]);

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
      // 現在のフォーカス要素を保存
      const activeElement = document.activeElement as HTMLElement;

      audioChatService.stopListening();

      // フォーカスを元の要素に戻す（スクロール防止）
      if (activeElement && activeElement.focus) {
        setTimeout(() => {
          activeElement.focus({ preventScroll: true });
        }, 0);
      }
    }
  }, [audioChatService, isListening]);

  // 音声チャット停止
  const stopAudioChat = useCallback(() => {
    if (audioChatService) {
      audioChatService.stopAudioChat();
      setIsInitialized(false);
      setIsListening(false);
      setCurrentTranscript("");
    }
  }, [audioChatService]);

  // キーボードイベント（スペースキーでプッシュトゥトーク）
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

  // TTS音声リップシンクテスト
  const testTTSLipSync = useCallback(async () => {
    if (!isInitialized || status !== "idle") return;

    try {
      console.log("🎤 TTS音声リップシンクテスト開始");

      // 統合リップシンクサービスをインポート
      const { integratedLipSyncService } = await import(
        "@/lib/services/integrated-lipsync-service"
      );

      // テスト用テキスト
      const testText =
        "こんにちは、TTS音声リップシンクのテストです。あいうえお、かきくけこ。";

      // TTS音声リップシンクを開始
      await integratedLipSyncService.startAIResponseLipSync(testText);

      console.log("✅ TTS音声リップシンクテスト開始完了");
    } catch (error) {
      console.error("❌ TTS音声リップシンクテストエラー:", error);
      setError(`TTS音声リップシンクテストエラー: ${error}`);
    }
  }, [isInitialized, status]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioChatService) {
        audioChatService.cleanup();
      }
    };
  }, [audioChatService]);

  // ステータス表示用のスタイル
  const getStatusStyle = (status: AudioChatStatus) => {
    switch (status) {
      case "idle":
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground";
      case "listening":
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground";
      case "processing":
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground";
      case "speaking":
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground";
      case "error":
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground";
      default:
        return "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground";
    }
  };

  const getStatusText = (status: AudioChatStatus) => {
    switch (status) {
      case "idle":
        return "待機中";
      case "listening":
        return "音声入力中";
      case "processing":
        return "AI処理中";
      case "speaking":
        return "音声出力中";
      case "error":
        return "エラー";
      default:
        return "不明";
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>音声チャット</span>
          <div className={getStatusStyle(status)}>{getStatusText(status)}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 現在の音声認識結果 */}
        {currentTranscript && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>認識中:</strong> {currentTranscript}
            </p>
          </div>
        )}

        {/* コントロールボタン */}
        <div className="flex gap-2">
          {!isInitialized ? (
            <Button
              onClick={initializeAudioChat}
              className="flex-1"
              disabled={status === "error"}
            >
              <Mic className="w-4 h-4 mr-2" />
              音声チャット開始
            </Button>
          ) : (
            <>
              <Button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                variant={
                  status === "listening"
                    ? "destructive"
                    : status === "idle"
                    ? "default"
                    : "secondary"
                }
                className="flex-1"
                disabled={status !== "idle"}
                onFocus={(e) =>
                  e.target.scrollIntoView({
                    block: "nearest",
                    behavior: "auto",
                  })
                }
                style={{ scrollMargin: "0" }}
              >
                {(() => {
                  switch (status) {
                    case "listening":
                      return <MicOff className="w-4 h-4 mr-2" />;
                    case "processing":
                    case "speaking":
                      return <Mic className="w-4 h-4 mr-2 opacity-50" />;
                    case "idle":
                    default:
                      return <Mic className="w-4 h-4 mr-2" />;
                  }
                })()}
                {(() => {
                  switch (status) {
                    case "listening":
                      return "録音中";
                    case "processing":
                      return "AI処理中";
                    case "speaking":
                      return "音声再生中";
                    case "idle":
                    default:
                      return "長押しで録音";
                  }
                })()}
              </Button>
              <Button onClick={stopAudioChat} variant="outline" size="icon">
                <VolumeX className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setLipSyncEnabled(!lipSyncEnabled)}
                variant={lipSyncEnabled ? "default" : "outline"}
                size="icon"
                title={lipSyncEnabled ? "リップシンク有効" : "リップシンク無効"}
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                onClick={testTTSLipSync}
                variant="outline"
                size="icon"
                disabled={!isInitialized || status !== "idle"}
                title="TTS音声リップシンクテスト"
              >
                🎤
              </Button>
            </>
          )}
        </div>

        {/* 使用方法 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• ボタン長押しまたはスペースキー長押しで音声入力</p>
          <p>• 音声認識後、自動でAI応答を音声で再生</p>
          <p>• 🎤ボタンでTTS音声リップシンクテスト実行</p>
          <p>• 日本語音声認識・合成に対応</p>
        </div>

        {/* 音声設定情報 */}
        {availableVoices.length > 0 && (
          <div className="text-xs text-gray-500">
            <p>
              利用可能な音声:{" "}
              {availableVoices.filter((v) => v.lang.startsWith("ja")).length}個
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
