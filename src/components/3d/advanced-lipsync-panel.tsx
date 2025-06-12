"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Settings, Activity, Brain } from "lucide-react";
import { advancedLipSyncService } from "@/lib/services/advanced-lipsync-service";
import { phonemeAnalysisService } from "@/lib/services/phoneme-analysis-service";

interface AdvancedLipSyncStatus {
  isActive: boolean;
  currentPhoneme: string;
  confidence: number;
  formants: { f1: number; f2: number; f3: number };
  sensitivity: number;
  responsiveness: number;
  confidenceThreshold: number;
  blendShapeSmoothing: number;
}

interface PhonemeAnalysisStatus {
  isAnalyzing: boolean;
  sampleRate: number;
  fftSize: number;
}

export function AdvancedLipSyncPanel() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // ステータス
  const [lipSyncStatus, setLipSyncStatus] = useState<AdvancedLipSyncStatus>({
    isActive: false,
    currentPhoneme: "sil",
    confidence: 0,
    formants: { f1: 0, f2: 0, f3: 0 },
    sensitivity: 1.0,
    responsiveness: 0.4,
    confidenceThreshold: 0.3,
    blendShapeSmoothing: 0.8,
  });

  const [analysisStatus, setAnalysisStatus] = useState<PhonemeAnalysisStatus>({
    isAnalyzing: false,
    sampleRate: 44100,
    fftSize: 2048,
  });

  // 音素履歴
  const [phonemeHistory, setPhonemeHistory] = useState<
    Array<{ phoneme: string; timestamp: number }>
  >([]);

  // ブレンドシェイプ状態
  const [currentBlendShapes, setCurrentBlendShapes] = useState<
    Record<string, number>
  >({});

  // 設定表示
  const [showSettings, setShowSettings] = useState(false);

  /**
   * ステータス更新
   */
  const updateStatus = useCallback(() => {
    const lipSync = advancedLipSyncService.getStatus();
    const analysis = phonemeAnalysisService.getAnalysisStatus();
    const debugInfo = advancedLipSyncService.getDebugInfo();

    setLipSyncStatus(lipSync);
    setAnalysisStatus(analysis);
    setPhonemeHistory(debugInfo.phonemeHistory);
    setCurrentBlendShapes(debugInfo.currentBlendShapes);
  }, []);

  /**
   * 定期的なステータス更新
   */
  useEffect(() => {
    const interval = setInterval(updateStatus, 100); // 10FPS
    return () => clearInterval(interval);
  }, [updateStatus]);

  /**
   * 高精度リップシンクを開始
   */
  const startAdvancedLipSync = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // マイクロフォンアクセス
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      // 高精度リップシンクを開始
      await advancedLipSyncService.startAdvancedLipSync(mediaStream);

      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error("高精度リップシンク開始エラー:", err);
      setError(
        err instanceof Error
          ? err.message
          : "高精度リップシンク開始に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 高精度リップシンクを停止
   */
  const stopAdvancedLipSync = (): void => {
    try {
      advancedLipSyncService.stopAdvancedLipSync();

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      setIsActive(false);
      setError(null);
    } catch (err) {
      console.error("高精度リップシンク停止エラー:", err);
      setError(
        err instanceof Error
          ? err.message
          : "高精度リップシンク停止に失敗しました"
      );
    }
  };

  /**
   * 音素の表示名を取得
   */
  const getPhonemeDisplayName = (phoneme: string): string => {
    const phonemeNames: Record<string, string> = {
      sil: "無音",
      aa: "あ",
      ih: "い",
      ou: "う",
      E: "え",
      oh: "お",
      PP: "p/b",
      FF: "f/v",
      TH: "th",
      DD: "d/t",
      kk: "k/g",
      CH: "ch/j",
      SS: "s/z",
      nn: "n/m",
      RR: "r/l",
    };
    return phonemeNames[phoneme] || phoneme;
  };

  /**
   * 信頼度の色を取得
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return "bg-green-500";
    if (confidence >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="bg-background/95">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          高精度リップシンク
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="ml-auto"
          >
            {isActive ? "動作中" : "停止中"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 制御ボタン */}
        <div className="flex gap-2">
          <Button
            onClick={isActive ? stopAdvancedLipSync : startAdvancedLipSync}
            disabled={isLoading}
            variant={isActive ? "destructive" : "default"}
            size="sm"
            className="flex-1"
          >
            {isActive ? (
              <>
                <MicOff className="h-4 w-4 mr-1" />
                停止
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                開始
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* 現在の音素情報 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">現在の音素</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${getConfidenceColor(
                lipSyncStatus.confidence
              )} text-white border-none`}
            >
              {getPhonemeDisplayName(lipSyncStatus.currentPhoneme)}
            </Badge>
            <span className="text-xs text-gray-600">
              信頼度: {(lipSyncStatus.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* フォルマント情報 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">フォルマント</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="font-medium">F1</div>
              <div>{lipSyncStatus.formants.f1.toFixed(0)}Hz</div>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="font-medium">F2</div>
              <div>{lipSyncStatus.formants.f2.toFixed(0)}Hz</div>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="font-medium">F3</div>
              <div>{lipSyncStatus.formants.f3.toFixed(0)}Hz</div>
            </div>
          </div>
        </div>

        {/* 音素履歴 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">音素履歴</div>
          <div className="flex flex-wrap gap-1">
            {phonemeHistory.slice(-8).map((entry, index) => (
              <Badge
                key={`${entry.phoneme}-${entry.timestamp}-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {getPhonemeDisplayName(entry.phoneme)}
              </Badge>
            ))}
          </div>
        </div>

        {/* ブレンドシェイプ状態 */}
        <div className="space-y-2">
          <div className="text-sm font-medium">ブレンドシェイプ</div>
          <div className="space-y-1">
            {["A", "I", "U", "E", "O"].map((shape) => {
              const current = currentBlendShapes[shape] || 0;
              return (
                <div key={shape} className="flex items-center gap-2 text-xs">
                  <span className="w-4 font-mono">{shape}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${current * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">
                    {(current * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 設定パネル */}
        {showSettings && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="text-sm font-medium">設定</div>

              {/* 感度 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>感度</span>
                  <span>{lipSyncStatus.sensitivity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lipSyncStatus.sensitivity]}
                  onValueChange={([value]) =>
                    advancedLipSyncService.setSensitivity(value)
                  }
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* 応答性 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>応答性</span>
                  <span>{lipSyncStatus.responsiveness.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lipSyncStatus.responsiveness]}
                  onValueChange={([value]) =>
                    advancedLipSyncService.setResponsiveness(value)
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* 信頼度閾値 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>信頼度閾値</span>
                  <span>{lipSyncStatus.confidenceThreshold.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lipSyncStatus.confidenceThreshold]}
                  onValueChange={([value]) =>
                    advancedLipSyncService.setConfidenceThreshold(value)
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* スムージング */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>スムージング</span>
                  <span>{lipSyncStatus.blendShapeSmoothing.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lipSyncStatus.blendShapeSmoothing]}
                  onValueChange={([value]) =>
                    advancedLipSyncService.setBlendShapeSmoothing(value)
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}

        {/* システム情報 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>サンプルレート: {analysisStatus.sampleRate}Hz</div>
          <div>FFTサイズ: {analysisStatus.fftSize}</div>
          <div>
            ステータス: {analysisStatus.isAnalyzing ? "解析中" : "待機中"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
