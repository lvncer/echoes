"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { lipSyncService } from "@/lib/services/lipsync-service";
import { Mic, MicOff, Settings, Activity, Volume2 } from "lucide-react";

interface LipSyncPanelProps {
  className?: string;
}

/**
 * リップシンク制御パネル
 */
export function LipSyncPanel({ className }: LipSyncPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState(lipSyncService.getStatus());
  const [debugInfo, setDebugInfo] = useState(lipSyncService.getDebugInfo());
  const [error, setError] = useState<string | null>(null);

  // ステータスを定期的に更新
  useEffect(() => {
    const updateStatus = () => {
      setStatus(lipSyncService.getStatus());
      setDebugInfo(lipSyncService.getDebugInfo());
    };

    const interval = setInterval(updateStatus, 100);
    return () => clearInterval(interval);
  }, []);

  // リップシンクを開始
  const startLipSync = async () => {
    try {
      setError(null);

      // マイクロフォンアクセスを要求
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(mediaStream);

      // リップシンクを開始
      await lipSyncService.startLipSync(mediaStream);
      setIsActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラー";
      setError(`リップシンク開始エラー: ${errorMessage}`);
      console.error("リップシンク開始エラー:", err);
    }
  };

  // リップシンクを停止
  const stopLipSync = () => {
    lipSyncService.stopLipSync();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsActive(false);
    setError(null);
  };

  // 設定変更ハンドラー
  const handleSensitivityChange = (value: number[]) => {
    lipSyncService.setSensitivity(value[0]);
  };

  const handleResponsivenessChange = (value: number[]) => {
    lipSyncService.setResponsiveness(value[0]);
  };

  const handleVolumeThresholdChange = (value: number[]) => {
    lipSyncService.setVolumeThreshold(value[0]);
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Mic className="w-4 h-4 mr-2" />
          リップシンク
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}>
      <Card className="bg-background/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              リップシンク制御
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 制御ボタン */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startLipSync} className="flex-1" size="sm">
                <Mic className="w-4 h-4 mr-2" />
                開始
              </Button>
            ) : (
              <Button
                onClick={stopLipSync}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <MicOff className="w-4 h-4 mr-2" />
                停止
              </Button>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
              {error}
            </div>
          )}

          {/* ステータス */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">ステータス</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "動作中" : "停止中"}
              </Badge>
              <Badge variant="outline">{status.currentPhoneme}</Badge>
            </div>
          </div>

          <Separator />

          {/* リアルタイム情報 */}
          {isActive && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">リアルタイム</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>音量レベル:</span>
                  <span>
                    {debugInfo.audioAnalysis.currentVolume.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>口の開き:</span>
                  <span>{status.mouthOpeningLevel.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>現在の音素:</span>
                  <span className="font-mono">{status.currentPhoneme}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* 設定調整 */}
          <div className="space-y-3">
            <span className="text-sm font-medium">設定調整</span>

            {/* 感度 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium">感度</label>
                <span className="text-xs text-muted-foreground">
                  {status.sensitivity.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[status.sensitivity]}
                onValueChange={handleSensitivityChange}
                max={3.0}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* 応答性 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium">応答性</label>
                <span className="text-xs text-muted-foreground">
                  {status.responsiveness.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[status.responsiveness]}
                onValueChange={handleResponsivenessChange}
                max={1.0}
                min={0.1}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* 音量閾値 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium">音量閾値</label>
                <span className="text-xs text-muted-foreground">
                  {status.volumeThreshold.toFixed(3)}
                </span>
              </div>
              <Slider
                value={[status.volumeThreshold]}
                onValueChange={handleVolumeThresholdChange}
                max={0.1}
                min={0.001}
                step={0.001}
                className="w-full"
              />
            </div>
          </div>

          {/* VRM情報 */}
          <div className="space-y-2">
            <span className="text-sm font-medium">VRM情報</span>
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>ブレンドシェイプ:</span>
                <span>
                  {debugInfo.blendShape.hasBlendShapeProxy ? "対応" : "未対応"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>利用可能数:</span>
                <span>{debugInfo.blendShape.availableShapesCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
