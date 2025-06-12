"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Volume2,
  Settings,
  Heart,
  Smile,
  Frown,
  Angry,
  Zap,
  RotateCcw,
} from "lucide-react";
import {
  integratedLipSyncService,
  EmotionType,
} from "@/lib/services/integrated-lipsync-service";

interface IntegratedLipSyncPanelProps {
  className?: string;
}

export function IntegratedLipSyncPanel({
  className,
}: IntegratedLipSyncPanelProps) {
  // 状態管理
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<"basic" | "advanced">(
    "advanced"
  );
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("neutral");
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

  // 設定
  const [emotionIntensity, setEmotionIntensity] = useState(0.5);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 感情アイコンマッピング
  const emotionIcons = {
    neutral: RotateCcw,
    happy: Smile,
    sad: Frown,
    angry: Angry,
    surprised: Zap,
  };

  // 感情ラベルマッピング
  const emotionLabels = {
    neutral: "通常",
    happy: "喜び",
    sad: "悲しみ",
    angry: "怒り",
    surprised: "驚き",
  };

  // 状態更新
  useEffect(() => {
    const updateStatus = () => {
      const status = integratedLipSyncService.getStatus();
      setIsActive(status.isActive);
      setCurrentMode(status.currentMode);
      setIsAutoMode(status.isAutoMode);
      setCurrentEmotion(status.currentEmotion);
      setIsTTSSpeaking(status.isTTSSpeaking);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 500);
    return () => clearInterval(interval);
  }, []);

  // マイクロフォンアクセス
  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return mediaStream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラー";
      setError(`マイクロフォンアクセスエラー: ${errorMessage}`);
      return null;
    }
  };

  // リップシンク開始
  const handleStartLipSync = async () => {
    try {
      setError(null);

      if (!stream) {
        const newStream = await requestMicrophoneAccess();
        if (!newStream) return;
        setStream(newStream);

        await integratedLipSyncService.startMicrophoneLipSync(newStream);
      } else {
        await integratedLipSyncService.startMicrophoneLipSync(stream);
      }

      setIsActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラー";
      setError(`リップシンク開始エラー: ${errorMessage}`);
    }
  };

  // リップシンク停止
  const handleStopLipSync = () => {
    integratedLipSyncService.stopLipSync();
    setIsActive(false);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // モード変更
  const handleModeChange = (mode: "basic" | "advanced") => {
    integratedLipSyncService.setMode(mode);
    setCurrentMode(mode);
  };

  // 自動モード切り替え
  const handleAutoModeToggle = () => {
    const newAutoMode = !isAutoMode;
    integratedLipSyncService.setAutoMode(newAutoMode);
    setIsAutoMode(newAutoMode);
  };

  // 感情強度変更
  const handleEmotionIntensityChange = (value: number[]) => {
    const intensity = value[0];
    integratedLipSyncService.setEmotionIntensity(intensity);
    setEmotionIntensity(intensity);
  };

  // 手動感情テスト
  const handleEmotionTest = async (emotion: EmotionType) => {
    const testTexts = {
      neutral: "こんにちは。",
      happy: "とても嬉しいです！ありがとうございます！",
      sad: "申し訳ありません。残念です。",
      angry: "それは許せません！",
      surprised: "えっ！本当ですか？びっくりしました！",
    };

    await integratedLipSyncService.startAIResponseLipSync(
      testTexts[emotion],
      emotion
    );
  };

  return (
    <Card className={`bg-background/95 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="w-4 h-4" />
          統合リップシンク制御
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* 基本制御 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">マイクロフォン</span>
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={isActive ? handleStopLipSync : handleStartLipSync}
              className="flex items-center gap-2"
            >
              {isActive ? (
                <>
                  <MicOff className="w-3 h-3" />
                  停止
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3" />
                  開始
                </>
              )}
            </Button>
          </div>

          {/* 状態表示 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "動作中" : "停止中"}
            </Badge>
            <Badge variant={isTTSSpeaking ? "default" : "outline"}>
              {isTTSSpeaking ? "TTS再生中" : "TTS停止"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* モード設定 */}
        <div className="space-y-2">
          <span className="text-sm font-medium">リップシンクモード</span>
          <Select value={currentMode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">基本モード（音量ベース）</SelectItem>
              <SelectItem value="advanced">高精度モード（音素解析）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* AI応答連動設定 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI応答連動</span>
            <Button
              variant={isAutoMode ? "default" : "outline"}
              size="sm"
              onClick={handleAutoModeToggle}
            >
              {isAutoMode ? "ON" : "OFF"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            AI応答時に自動でリップシンクと感情表現を適用
          </p>
        </div>

        <Separator />

        {/* 感情表現制御 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">感情表現</span>
          </div>

          {/* 現在の感情 */}
          <div className="flex items-center justify-between">
            <span className="text-xs">現在の感情:</span>
            <Badge variant="outline" className="flex items-center gap-1">
              {(() => {
                const IconComponent = emotionIcons[currentEmotion];
                return <IconComponent className="w-3 h-3" />;
              })()}
              {emotionLabels[currentEmotion]}
            </Badge>
          </div>

          {/* 感情強度 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium">感情強度</label>
              <span className="text-xs text-muted-foreground">
                {emotionIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[emotionIntensity]}
              onValueChange={handleEmotionIntensityChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* 感情テストボタン */}
          <div className="space-y-2">
            <span className="text-xs font-medium">感情テスト</span>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(emotionLabels) as EmotionType[]).map((emotion) => {
                const IconComponent = emotionIcons[emotion];
                return (
                  <Button
                    key={emotion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmotionTest(emotion)}
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="text-xs">{emotionLabels[emotion]}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* TTS制御 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">TTS音声制御</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">TTS連動リップシンク:</span>
            <Badge variant={isTTSSpeaking ? "default" : "secondary"}>
              {isTTSSpeaking ? "動作中" : "待機中"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            AI応答時に自動でTTS音声と同期したリップシンクを実行
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
