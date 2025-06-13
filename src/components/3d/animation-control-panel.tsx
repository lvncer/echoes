"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
// Checkbox import removed - using Button instead
import {
  Eye,
  EyeOff,
  Wind,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Bug,
} from "lucide-react";
import { AnimationController } from "@/lib/services/animation-controller";
import type {
  AnimationState,
  AnimationControlSettings,
} from "@/lib/types/animation";
import { getAvailableEmotions } from "@/lib/animations/emotion-animations";
import {
  getGesturesByCategory,
  getGestureDescription,
  type GestureType,
} from "@/lib/animations/gesture-animations";

interface AnimationControlPanelProps {
  className?: string;
}

// アニメーション制御サービスのインスタンス（シングルトン）
declare global {
  interface Window {
    __animationController?: AnimationController;
  }
}

const getAnimationController = () => {
  // グローバルに保存されたインスタンスを取得
  if (typeof window !== "undefined" && window.__animationController) {
    return window.__animationController;
  }
  // 新しいインスタンスを作成してグローバルに保存
  const controller = new AnimationController();
  if (typeof window !== "undefined") {
    window.__animationController = controller;
  }
  return controller;
};

/**
 * アニメーション制御パネル
 */
export function AnimationControlPanel({
  className,
}: AnimationControlPanelProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [settings, setSettings] = useState<AnimationControlSettings>({
    autoBlinking: {
      enabled: true,
      interval: [2000, 6000],
      intensity: 1.0,
    },
    breathing: {
      enabled: true,
      intensity: 0.5,
      speed: 1.0,
    },
    emotionAnimations: {
      enabled: true,
      intensity: 0.8,
      autoTrigger: true,
    },
    gestures: {
      enabled: true,
      handMovements: true,
      headMovements: true,
      bodyMovements: true,
      intensity: 0.7,
    },
  });
  const [animationState, setAnimationState] = useState<AnimationState>({
    activeAnimationCount: 0,
    frameRate: 0,
    calculationTime: 0,
    memoryUsage: 0,
    runningAnimations: {
      idle: null,
      emotion: null,
      gesture: null,
    },
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // アニメーション制御サービスの初期化
  useEffect(() => {
    const controller = getAnimationController();

    // 初期設定を適用
    controller.setEnabled(isEnabled);

    // 状態更新の定期実行
    const updateState = () => {
      setAnimationState(controller.getState());
    };

    updateState();
    const interval = setInterval(updateState, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isEnabled]);

  // 設定の初期化（一度だけ）
  useEffect(() => {
    const controller = getAnimationController();
    // 初期設定を非同期で適用
    const initialSettings = {
      autoBlinking: {
        enabled: true,
        interval: [2000, 6000] as [number, number],
        intensity: 1.0,
      },
      breathing: {
        enabled: true,
        intensity: 0.5,
        speed: 1.0,
      },
      emotionAnimations: {
        enabled: true,
        intensity: 0.8,
        autoTrigger: true,
      },
      gestures: {
        enabled: true,
        handMovements: true,
        headMovements: true,
        bodyMovements: true,
        intensity: 0.7,
      },
    };
    setTimeout(() => {
      controller.updateSettings(initialSettings);
    }, 0);
  }, []); // 初期化は一度だけ実行

  // 設定変更ハンドラー
  const handleSettingChange = (
    category: keyof AnimationControlSettings,
    key: string,
    value: boolean | number
  ) => {
    setSettings((prevSettings) => {
      const newSettings = {
        ...prevSettings,
        [category]: {
          ...prevSettings[category],
          [key]: value,
        },
      };
      // 非同期でコントローラーを更新（状態更新ループを避けるため）
      setTimeout(() => {
        getAnimationController().updateSettings(newSettings);
      }, 0);
      return newSettings;
    });
  };

  // アニメーション有効/無効切り替え
  const handleToggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    getAnimationController().setEnabled(newEnabled);
  };

  // 全アニメーション一時停止/再開
  const handlePauseResume = () => {
    const controller = getAnimationController();
    if (animationState.activeAnimationCount > 0) {
      controller.pauseAllAnimations();
    } else {
      controller.resumeAllAnimations();
    }
  };

  // 設定リセット
  const handleResetSettings = () => {
    const defaultSettings: AnimationControlSettings = {
      autoBlinking: {
        enabled: true,
        interval: [2000, 6000],
        intensity: 1.0,
      },
      breathing: {
        enabled: true,
        intensity: 0.5,
        speed: 1.0,
      },
      emotionAnimations: {
        enabled: true,
        intensity: 0.8,
        autoTrigger: true,
      },
      gestures: {
        enabled: true,
        handMovements: true,
        headMovements: true,
        bodyMovements: true,
        intensity: 0.7,
      },
    };
    setSettings(defaultSettings);
    // 非同期でコントローラーを更新
    setTimeout(() => {
      getAnimationController().updateSettings(defaultSettings);
    }, 0);
  };

  // パフォーマンス状態の色分け
  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return "text-green-600";
    if (value <= thresholds[1]) return "text-yellow-600";
    return "text-red-600";
  };

  // 感情アニメーションテスト
  const handleTestEmotionAnimation = (emotion: string) => {
    const controller = getAnimationController();
    controller.playEmotionAnimation(
      emotion as "neutral" | "happy" | "sad" | "angry" | "surprised",
      settings.emotionAnimations.intensity
    );
  };

  // ジェスチャーアニメーションテスト
  const handleTestGestureAnimation = (gestureType: GestureType) => {
    const controller = getAnimationController();
    controller.playGestureAnimation(gestureType, settings.gestures.intensity);
  };

  // 感情ラベルの取得
  const getEmotionLabel = (emotion: string): string => {
    const labels: Record<string, string> = {
      neutral: "ニュートラル",
      happy: "喜び",
      sad: "悲しみ",
      angry: "怒り",
      surprised: "驚き",
    };
    return labels[emotion] || emotion;
  };

  // 最後の感情解析結果を取得
  const getLastEmotionAnalysis = () => {
    return getAnimationController().getLastEmotionAnalysis();
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
          <Activity className="w-4 h-4 mr-2" />
          アニメーション
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-background/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              アニメーション制御
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 基本制御 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">アニメーション</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleEnabled}
                >
                  {isEnabled ? "ON" : "OFF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                  disabled={!isEnabled}
                >
                  {animationState.activeAnimationCount > 0 ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* 状態表示 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? "動作中" : "停止中"}
              </Badge>
              <Badge variant="outline">
                {animationState.activeAnimationCount}個実行中
              </Badge>
            </div>
          </div>

          <Separator />

          {/* 基本アニメーション制御 */}
          <div className="space-y-3">
            <span className="text-sm font-medium">基本アニメーション</span>

            {/* 自動瞬き */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium">自動瞬き</span>
                </div>
                <Button
                  variant={
                    settings.autoBlinking.enabled ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleSettingChange(
                      "autoBlinking",
                      "enabled",
                      !settings.autoBlinking.enabled
                    )
                  }
                  disabled={!isEnabled}
                >
                  {settings.autoBlinking.enabled ? "ON" : "OFF"}
                </Button>
              </div>

              {settings.autoBlinking.enabled && (
                <div className="space-y-2 ml-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs">強度</label>
                      <span className="text-xs text-muted-foreground">
                        {settings.autoBlinking.intensity.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[settings.autoBlinking.intensity]}
                      onValueChange={([value]) =>
                        handleSettingChange("autoBlinking", "intensity", value)
                      }
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                      disabled={!isEnabled}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 呼吸アニメーション */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs font-medium">呼吸</span>
                </div>
                <Button
                  variant={settings.breathing.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleSettingChange(
                      "breathing",
                      "enabled",
                      !settings.breathing.enabled
                    )
                  }
                  disabled={!isEnabled}
                >
                  {settings.breathing.enabled ? "ON" : "OFF"}
                </Button>
              </div>

              {settings.breathing.enabled && (
                <div className="space-y-2 ml-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs">強度</label>
                      <span className="text-xs text-muted-foreground">
                        {settings.breathing.intensity.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[settings.breathing.intensity]}
                      onValueChange={([value]) =>
                        handleSettingChange("breathing", "intensity", value)
                      }
                      max={1.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                      disabled={!isEnabled}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs">速度</label>
                      <span className="text-xs text-muted-foreground">
                        {settings.breathing.speed.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[settings.breathing.speed]}
                      onValueChange={([value]) =>
                        handleSettingChange("breathing", "speed", value)
                      }
                      max={2.0}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                      disabled={!isEnabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* パフォーマンス監視 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">パフォーマンス</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>フレームレート:</span>
                <span
                  className={getPerformanceColor(
                    animationState.frameRate,
                    [30, 60]
                  )}
                >
                  {animationState.frameRate.toFixed(0)} fps
                </span>
              </div>
              <div className="flex justify-between">
                <span>計算時間:</span>
                <span
                  className={getPerformanceColor(
                    animationState.calculationTime,
                    [5, 10]
                  )}
                >
                  {animationState.calculationTime.toFixed(1)} ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>実行中:</span>
                <span>
                  {Object.values(animationState.runningAnimations)
                    .filter(Boolean)
                    .join(", ") || "なし"}
                </span>
              </div>
            </div>
          </div>

          {/* デバッグ情報 */}
          {showAdvanced && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  <span className="text-sm font-medium">デバッグ情報</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>アクティブアニメーション:</span>
                    <span>
                      {
                        Object.values(animationState.runningAnimations).filter(
                          Boolean
                        ).length
                      }
                      個
                    </span>
                  </div>
                  {animationState.runningAnimations.idle && (
                    <div className="flex justify-between">
                      <span>アイドル:</span>
                      <span className="font-mono">
                        {animationState.runningAnimations.idle}
                      </span>
                    </div>
                  )}
                  {animationState.runningAnimations.emotion && (
                    <div className="flex justify-between">
                      <span>感情:</span>
                      <span className="font-mono">
                        {animationState.runningAnimations.emotion}
                      </span>
                    </div>
                  )}
                  {animationState.runningAnimations.gesture && (
                    <div className="flex justify-between">
                      <span>ジェスチャー:</span>
                      <span className="font-mono">
                        {animationState.runningAnimations.gesture}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const lastEmotion = getLastEmotionAnalysis();
                    return lastEmotion ? (
                      <>
                        <div className="flex justify-between">
                          <span>最後の感情:</span>
                          <span className="font-mono">
                            {lastEmotion.emotion}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>信頼度:</span>
                          <span>
                            {(lastEmotion.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            </>
          )}

          {/* 高度な設定 */}
          {showAdvanced && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">高度な設定</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetSettings}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    リセット
                  </Button>
                </div>

                {/* 感情アニメーション */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      感情アニメーション
                    </span>
                    <Button
                      variant={
                        settings.emotionAnimations.enabled
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleSettingChange(
                          "emotionAnimations",
                          "enabled",
                          !settings.emotionAnimations.enabled
                        )
                      }
                      disabled={!isEnabled}
                    >
                      {settings.emotionAnimations.enabled ? "ON" : "OFF"}
                    </Button>
                  </div>

                  {settings.emotionAnimations.enabled && (
                    <div className="space-y-1 ml-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs">強度</label>
                        <span className="text-xs text-muted-foreground">
                          {settings.emotionAnimations.intensity.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.emotionAnimations.intensity]}
                        onValueChange={([value]) =>
                          handleSettingChange(
                            "emotionAnimations",
                            "intensity",
                            value
                          )
                        }
                        max={1.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                        disabled={!isEnabled}
                      />
                    </div>
                  )}
                </div>

                {/* ジェスチャー */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">ジェスチャー</span>
                    <Button
                      variant={
                        settings.gestures.enabled ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleSettingChange(
                          "gestures",
                          "enabled",
                          !settings.gestures.enabled
                        )
                      }
                      disabled={!isEnabled}
                    >
                      {settings.gestures.enabled ? "ON" : "OFF"}
                    </Button>
                  </div>

                  {settings.gestures.enabled && (
                    <div className="space-y-1 ml-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs">強度</label>
                        <span className="text-xs text-muted-foreground">
                          {settings.gestures.intensity.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[settings.gestures.intensity]}
                        onValueChange={([value]) =>
                          handleSettingChange("gestures", "intensity", value)
                        }
                        max={1.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                        disabled={!isEnabled}
                      />
                    </div>
                  )}
                </div>

                {/* 感情アニメーションテスト */}
                <div className="space-y-2">
                  <span className="text-xs font-medium">
                    感情アニメーションテスト
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {getAvailableEmotions().map((emotion) => (
                      <Button
                        key={emotion}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestEmotionAnimation(emotion)}
                        disabled={!isEnabled}
                        className="text-xs"
                      >
                        {getEmotionLabel(emotion)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* ジェスチャーアニメーションテスト */}
                <div className="space-y-2">
                  <span className="text-xs font-medium">
                    ジェスチャーアニメーションテスト
                  </span>

                  {/* 手のジェスチャー */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      手の動き
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {getGesturesByCategory("hand").map((gesture) => (
                        <Button
                          key={gesture}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGestureAnimation(gesture)}
                          disabled={
                            !isEnabled || !settings.gestures.handMovements
                          }
                          className="text-xs"
                          title={getGestureDescription(gesture)}
                        >
                          {gesture === "pointRight" && "指差し"}
                          {gesture === "wave" && "手振り"}
                          {gesture === "clap" && "拍手"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 頭のジェスチャー */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      頭の動き
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {getGesturesByCategory("head").map((gesture) => (
                        <Button
                          key={gesture}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGestureAnimation(gesture)}
                          disabled={
                            !isEnabled || !settings.gestures.headMovements
                          }
                          className="text-xs"
                          title={getGestureDescription(gesture)}
                        >
                          {gesture === "nod" && "うなずき"}
                          {gesture === "shake" && "首振り"}
                          {gesture === "tilt" && "傾き"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 体のジェスチャー */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      体の動き
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {getGesturesByCategory("body").map((gesture) => (
                        <Button
                          key={gesture}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGestureAnimation(gesture)}
                          disabled={
                            !isEnabled || !settings.gestures.bodyMovements
                          }
                          className="text-xs"
                          title={getGestureDescription(gesture)}
                        >
                          {gesture === "leanForward" && "前傾"}
                          {gesture === "leanBack" && "後退"}
                          {gesture === "shrug" && "肩すくめ"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 感情解析結果表示 */}
                {getLastEmotionAnalysis() && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium">最後の感情解析</span>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>感情:</span>
                        <span className="font-medium">
                          {getEmotionLabel(getLastEmotionAnalysis()!.emotion)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>強度:</span>
                        <span>
                          {getLastEmotionAnalysis()!.intensity.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>信頼度:</span>
                        <span>
                          {getLastEmotionAnalysis()!.confidence.toFixed(2)}
                        </span>
                      </div>
                      {getLastEmotionAnalysis()!.keywords.length > 0 && (
                        <div className="space-y-1">
                          <span>キーワード:</span>
                          <div className="flex flex-wrap gap-1">
                            {getLastEmotionAnalysis()!
                              .keywords.slice(0, 3)
                              .map((keyword, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
