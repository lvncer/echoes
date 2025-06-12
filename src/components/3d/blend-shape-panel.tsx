"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { blendShapeService } from "@/lib/services/blend-shape-service";
import { Eye, EyeOff, RotateCcw, Info } from "lucide-react";

interface BlendShapePanelProps {
  className?: string;
}

/**
 * VRMブレンドシェイプ制御パネル（デバッグ用）
 */
export function BlendShapePanel({ className }: BlendShapePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [vrmInfo, setVrmInfo] = useState(blendShapeService.getVRMInfo());
  const [currentWeights, setCurrentWeights] = useState<Record<string, number>>(
    {}
  );
  const [supportedShapes, setSupportedShapes] = useState<string[]>([]);

  // VRM情報を定期的に更新
  useEffect(() => {
    const updateVRMInfo = () => {
      const info = blendShapeService.getVRMInfo();
      setVrmInfo(info);

      if (info.hasBlendShapeProxy) {
        // 対応済みブレンドシェイプをテスト
        const basicShapes = [
          "A",
          "I",
          "U",
          "E",
          "O",
          "Joy",
          "Angry",
          "Sorrow",
          "Fun",
        ];
        const supported = basicShapes.filter((shape) =>
          blendShapeService.isBlendShapeAvailable(shape)
        );
        setSupportedShapes(supported);

        // 現在のウェイトを取得
        setCurrentWeights(blendShapeService.getCurrentWeights());
      }
    };

    updateVRMInfo();
    const interval = setInterval(updateVRMInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  // ブレンドシェイプウェイトを変更
  const handleWeightChange = (shapeName: string, value: number[]) => {
    const weight = value[0];
    blendShapeService.setBlendShapeWeight(shapeName, weight);
    setCurrentWeights((prev) => ({ ...prev, [shapeName]: weight }));
  };

  // すべてリセット
  const handleResetAll = () => {
    blendShapeService.resetAllBlendShapes();
    setCurrentWeights({});
  };

  // 基本表情のプリセット
  const applyPreset = (presetName: string) => {
    const presets: Record<string, Record<string, number>> = {
      neutral: {},
      happy: { Joy: 1.0, A: 0.3 },
      sad: { Sorrow: 1.0 },
      angry: { Angry: 1.0 },
      surprised: { Fun: 0.8, A: 0.5 },
      "mouth-a": { A: 1.0 },
      "mouth-i": { I: 1.0 },
      "mouth-u": { U: 1.0 },
      "mouth-e": { E: 1.0 },
      "mouth-o": { O: 1.0 },
    };

    const preset = presets[presetName];
    if (preset) {
      blendShapeService.resetAllBlendShapes();
      blendShapeService.setMultipleBlendShapes(preset);
      setCurrentWeights(blendShapeService.getCurrentWeights());
    }
  };

  if (!isVisible) {
    return (
      <div className={`fixed top-4 left-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          ブレンドシェイプ
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 left-4 z-50 w-80 ${className}`}>
      <Card className="bg-background/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              ブレンドシェイプ制御
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* VRM情報 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">VRM情報</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge
                variant={vrmInfo.hasBlendShapeProxy ? "default" : "secondary"}
              >
                {vrmInfo.hasBlendShapeProxy ? "対応" : "未対応"}
              </Badge>
              <Badge variant="outline">
                {vrmInfo.availableShapesCount}個利用可能
              </Badge>
            </div>
          </div>

          <Separator />

          {/* プリセット */}
          {vrmInfo.hasBlendShapeProxy && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">プリセット</span>
                  <Button variant="outline" size="sm" onClick={handleResetAll}>
                    <RotateCcw className="w-3 h-3 mr-1" />
                    リセット
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { key: "neutral", label: "通常" },
                    { key: "happy", label: "喜び" },
                    { key: "sad", label: "悲しみ" },
                    { key: "angry", label: "怒り" },
                  ].map((preset) => (
                    <Button
                      key={preset.key}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.key)}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {["A", "I", "U", "E", "O"].map((vowel) => (
                    <Button
                      key={vowel}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        applyPreset(`mouth-${vowel.toLowerCase()}`)
                      }
                      className="text-xs"
                    >
                      {vowel}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 手動制御 */}
              <div className="space-y-3">
                <span className="text-sm font-medium">手動制御</span>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {supportedShapes.map((shapeName) => (
                    <div key={shapeName} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium">
                          {shapeName}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {(currentWeights[shapeName] || 0).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[currentWeights[shapeName] || 0]}
                        onValueChange={(value) =>
                          handleWeightChange(shapeName, value)
                        }
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 未対応の場合 */}
          {!vrmInfo.hasBlendShapeProxy && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                VRMモデルが読み込まれていないか、
                <br />
                ブレンドシェイプに対応していません
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
