"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";
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
  const [audioChatService, setAudioChatService] = useState<AudioChatIntegrationService | null>(null);
  const [status, setStatus] = useState<AudioChatStatus>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // デフォルト設定
  const defaultConfig: AudioChatConfig = {
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
  };

  // コールバック設定
  const callbacks: AudioChatCallbacks = {
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
      // 音声合成開始時の処理
    },
    onSpeechEnd: () => {
      // 音声合成終了時の処理
    },
    onError: (error: AudioError) => {
      setError(error.message);
      console.error("音声チャットエラー:", error);
    },
    onStatusChange: (newStatus: AudioChatStatus) => {
      setStatus(newStatus);
    },
  };

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
  }, []);

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

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioChatService) {
        audioChatService.cleanup();
      }
    };
  }, [audioChatService]);

  // ステータス表示用の色とテキスト
  const getStatusDisplay = (status: AudioChatStatus) => {
    switch (status) {
      case "idle":
        return { color: "secondary", text: "待機中" };
      case "listening":
        return { color: "destructive", text: "音声入力中" };
      case "processing":
        return { color: "default", text: "AI処理中" };
      case "speaking":
        return { color: "default", text: "音声出力中" };
      case "error":
        return { color: "destructive", text: "エラー" };
      default:
        return { color: "secondary", text: "不明" };
    }
  };

  const statusDisplay = getStatusDisplay(status);

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>音声チャット</span>
          <Badge variant={statusDisplay.color as any}>
            {statusDisplay.text}
          </Badge>
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
                variant={isListening ? "destructive" : "default"}
                className="flex-1"
                disabled={status !== "idle"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 mr-2" />
                ) : (
                  <Mic className="w-4 h-4 mr-2" />
                )}
                {isListening ? "録音中" : "長押しで録音"}
              </Button>
              <Button
                onClick={stopAudioChat}
                variant="outline"
                size="icon"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* 使用方法 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• ボタン長押しまたはスペースキー長押しで音声入力</p>
          <p>• 音声認識後、自動でAI応答を音声で再生</p>
          <p>• 日本語音声認識・合成に対応</p>
        </div>

        {/* 音声設定情報 */}
        {availableVoices.length > 0 && (
          <div className="text-xs text-gray-500">
            <p>利用可能な音声: {availableVoices.filter(v => v.lang.startsWith('ja')).length}個</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 