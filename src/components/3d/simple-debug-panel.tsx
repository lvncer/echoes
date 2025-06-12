"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  RefreshCw,
  CheckCircle,
  XCircle,
  Play,
  Volume2,
  TestTube,
} from "lucide-react";

import { lipSyncService } from "@/lib/services/lipsync-service";
import { advancedLipSyncService } from "@/lib/services/advanced-lipsync-service";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
import { blendShapeService } from "@/lib/services/blend-shape-service";
import { AnimationController } from "@/lib/services/animation-controller";
import {
  getAllGestures,
  getGesturesByCategory,
} from "@/lib/animations/gesture-animations";
import { getAvailableEmotions } from "@/lib/animations/emotion-animations";
import {
  AnimationPerformanceTester,
  type PerformanceTestSuite,
} from "@/lib/services/animation-performance-tester";

interface SimpleDebugPanelProps {
  className?: string;
}

export function SimpleDebugPanel({ className }: SimpleDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // 各サービスの状態
  const [basicStatus, setBasicStatus] = useState(lipSyncService.getStatus());
  const [advancedStatus, setAdvancedStatus] = useState(
    advancedLipSyncService.getStatus()
  );
  const [integratedStatus, setIntegratedStatus] = useState(
    integratedLipSyncService.getStatus()
  );
  const [blendShapeInfo, setBlendShapeInfo] = useState(
    blendShapeService.getVRMInfo()
  );

  // アニメーション制御サービスの状態
  const [animationController, setAnimationController] =
    useState<AnimationController | null>(null);
  const [animationState, setAnimationState] = useState({
    activeAnimationCount: 0,
    frameRate: 0,
    calculationTime: 0,
    memoryUsage: 0,
    runningAnimations: {
      idle: null as string | null,
      emotion: null as string | null,
      gesture: null as string | null,
    },
  });

  // パフォーマンステスト関連の状態
  const [performanceTester, setPerformanceTester] =
    useState<AnimationPerformanceTester | null>(null);
  const [performanceTestResults, setPerformanceTestResults] =
    useState<PerformanceTestSuite | null>(null);
  const [isPerformanceTestRunning, setIsPerformanceTestRunning] =
    useState(false);

  /**
   * アニメーション制御サービスを取得
   */
  const getAnimationController = useCallback(() => {
    if (typeof window !== "undefined" && window.__animationController) {
      return window.__animationController;
    }
    return null;
  }, []);

  /**
   * 全ステータスを更新
   */
  const updateAllStatus = useCallback(() => {
    try {
      setBasicStatus(lipSyncService.getStatus());
      setAdvancedStatus(advancedLipSyncService.getStatus());
      setIntegratedStatus(integratedLipSyncService.getStatus());
      setBlendShapeInfo(blendShapeService.getVRMInfo());

      // アニメーション制御サービスの状態更新
      const controller = getAnimationController();
      if (controller) {
        setAnimationController(controller);
        setAnimationState(controller.getState());

        // パフォーマンステスターの初期化
        if (!performanceTester) {
          setPerformanceTester(new AnimationPerformanceTester(controller));
        }
      }
    } catch (error) {
      console.error("デバッグパネル更新エラー:", error);
    }
  }, [getAnimationController, performanceTester]);

  /**
   * 定期更新（高頻度でリアルタイム表示）
   */
  useEffect(() => {
    const interval = setInterval(updateAllStatus, 200); // 200ms間隔で更新
    return () => clearInterval(interval);
  }, [updateAllStatus]);

  /**
   * ブレンドシェイプテスト実行
   */
  const runBlendShapeTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      console.log("🧪 ブレンドシェイプテスト開始");
      setTestResults((prev) => [...prev, "ブレンドシェイプテスト開始..."]);

      // まず利用可能なブレンドシェイプを表示
      const availableShapes = blendShapeService.getAvailableBlendShapes();
      setTestResults((prev) => [
        ...prev,
        `📋 利用可能な形状: ${availableShapes.length}個`,
      ]);
      setTestResults((prev) => [
        ...prev,
        `📝 形状名: ${availableShapes.join(", ")}`,
      ]);

      const testResult = await blendShapeService.testBlendShapes();

      if (testResult.success) {
        setTestResults((prev) => [...prev, "✅ ブレンドシェイプテスト成功"]);
        testResult.results.forEach((result) => {
          const status = result.available ? "✅" : "❌";
          setTestResults((prev) => [
            ...prev,
            `${status} ${result.name}: ${result.testValue.toFixed(3)}`,
          ]);
        });
      } else {
        setTestResults((prev) => [...prev, "❌ ブレンドシェイプテスト失敗"]);
      }
    } catch (error) {
      setTestResults((prev) => [...prev, `❌ エラー: ${error}`]);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * デモアニメーション実行
   */
  const runDemoAnimation = async () => {
    setIsTestRunning(true);
    try {
      console.log("🎭 デモアニメーション開始");
      setTestResults((prev) => [...prev, "デモアニメーション開始..."]);

      // 利用可能なブレンドシェイプを使って順番にテスト
      const availableShapes = blendShapeService.getAvailableBlendShapes();
      setTestResults((prev) => [
        ...prev,
        `🔍 ${availableShapes.length}個の形状をテスト中...`,
      ]);

      for (let i = 0; i < Math.min(availableShapes.length, 5); i++) {
        const shapeName = availableShapes[i];
        setTestResults((prev) => [...prev, `🎭 ${shapeName} を 0.8 に設定`]);

        // ブレンドシェイプを設定
        blendShapeService.setBlendShapeWeight(shapeName, 0.8);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒待機

        // リセット
        blendShapeService.setBlendShapeWeight(shapeName, 0);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5秒待機
      }

      setTestResults((prev) => [...prev, "✅ デモアニメーション完了"]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ デモアニメーションエラー: ${error}`,
      ]);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * TTS音声リップシンクテスト
   */
  const runTTSTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      console.log("🔊 TTS音声リップシンクテスト開始");
      setTestResults((prev) => [...prev, "TTS音声リップシンクテスト開始..."]);

      // VRMモデルの確認
      if (!blendShapeInfo.hasVRM) {
        setTestResults((prev) => [
          ...prev,
          "⚠️ VRMモデルが読み込まれていません",
        ]);
        return;
      }

      // 利用可能なブレンドシェイプを表示
      const availableShapes = blendShapeService.getAvailableBlendShapes();
      setTestResults((prev) => [
        ...prev,
        `📋 利用可能な形状: ${availableShapes.length}個`,
      ]);
      setTestResults((prev) => [
        ...prev,
        `📝 形状名: ${availableShapes.join(", ")}`,
      ]);

      // テスト用のサンプルテキスト（音素が豊富）
      const testTexts = [
        "あいうえお",
        "かきくけこ、さしすせそ",
        "こんにちは、私はAIアシスタントです",
        "今日はとても良い天気ですね",
      ];

      for (let i = 0; i < testTexts.length; i++) {
        const text = testTexts[i];
        setTestResults((prev) => [...prev, `🗣️ テスト${i + 1}: "${text}"`]);

        // 統合リップシンクサービスの状態を確認
        const statusBefore = integratedLipSyncService.getStatus();
        setTestResults((prev) => [
          ...prev,
          `📊 開始前状態: TTS=${statusBefore.isTTSSpeaking}, Active=${statusBefore.isActive}`,
        ]);

        // TTS音声リップシンクを開始
        await integratedLipSyncService.startAIResponseLipSync(text);

        // 少し待ってから状態確認
        await new Promise((resolve) => setTimeout(resolve, 500));
        const statusAfter = integratedLipSyncService.getStatus();
        setTestResults((prev) => [
          ...prev,
          `📊 開始後状態: TTS=${statusAfter.isTTSSpeaking}, Active=${statusAfter.isActive}`,
        ]);

        // 音声が終わるまで監視
        let monitorCount = 0;
        const maxMonitorTime = Math.max(5000, text.length * 200); // 最低5秒、文字数×200ms
        const maxChecks = maxMonitorTime / 500;

        await new Promise<void>((resolve) => {
          const checkCompletion = () => {
            monitorCount++;
            const status = integratedLipSyncService.getStatus();

            if (monitorCount <= 3 || monitorCount % 4 === 0) {
              setTestResults((prev) => [
                ...prev,
                `🔍 監視[${monitorCount}]: TTS=${status.isTTSSpeaking}`,
              ]);
            }

            if (!status.isTTSSpeaking || monitorCount >= maxChecks) {
              setTestResults((prev) => [
                ...prev,
                `✅ テスト${i + 1}完了 (${monitorCount}回監視)`,
              ]);
              resolve();
            } else {
              setTimeout(checkCompletion, 500);
            }
          };
          setTimeout(checkCompletion, 1000); // 1秒後から監視開始
        });

        // 次のテストまで少し待機
        if (i < testTexts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      setTestResults((prev) => [...prev, "🎉 TTS音声リップシンクテスト完了"]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ TTS音声リップシンクテストエラー: ${error}`,
      ]);
      console.error("TTS音声リップシンクテストエラー:", error);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * 手動ブレンドシェイプテスト
   */
  const testManualBlendShape = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      console.log("🎭 手動ブレンドシェイプテスト開始");
      setTestResults((prev) => [...prev, "手動ブレンドシェイプテスト開始..."]);

      // 利用可能なブレンドシェイプを取得
      const availableShapes = blendShapeService.getAvailableBlendShapes();
      if (availableShapes.length === 0) {
        setTestResults((prev) => [
          ...prev,
          "❌ 利用可能なブレンドシェイプがありません",
        ]);
        return;
      }

      setTestResults((prev) => [
        ...prev,
        `📋 ${availableShapes.length}個の形状で手動テスト`,
      ]);

      // 各ブレンドシェイプを順番に最大値でテスト
      for (let i = 0; i < Math.min(availableShapes.length, 8); i++) {
        const shapeName = availableShapes[i];

        setTestResults((prev) => [...prev, `🎭 ${shapeName} を 1.0 に設定`]);

        // 最大値で設定
        blendShapeService.setBlendShapeWeight(shapeName, 1.0);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒間表示

        // リセット
        blendShapeService.setBlendShapeWeight(shapeName, 0);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5秒待機

        setTestResults((prev) => [...prev, `✅ ${shapeName} テスト完了`]);
      }

      setTestResults((prev) => [...prev, "🎉 手動ブレンドシェイプテスト完了"]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ 手動ブレンドシェイプテストエラー: ${error}`,
      ]);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * 統合テスト実行
   */
  const runTest = async () => {
    await runBlendShapeTest();
  };

  /**
   * アニメーションテスト実行
   */
  const runAnimationTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      console.log("🎭 アニメーションテスト開始");
      setTestResults((prev) => [...prev, "アニメーションテスト開始..."]);

      const controller = getAnimationController();
      if (!controller) {
        setTestResults((prev) => [
          ...prev,
          "❌ アニメーション制御サービスが利用できません",
        ]);
        return;
      }

      setTestResults((prev) => [...prev, "✅ アニメーション制御サービス確認"]);

      // 感情アニメーションテスト
      setTestResults((prev) => [...prev, "🎭 感情アニメーションテスト開始"]);
      const emotions = getAvailableEmotions();
      for (let i = 0; i < Math.min(emotions.length, 3); i++) {
        const emotion = emotions[i];
        setTestResults((prev) => [...prev, `😊 ${emotion} アニメーション実行`]);

        controller.playEmotionAnimation(
          emotion as "neutral" | "happy" | "sad" | "angry" | "surprised",
          0.8
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        controller.stopCurrentEmotionAnimation();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // ジェスチャーアニメーションテスト
      setTestResults((prev) => [
        ...prev,
        "🤲 ジェスチャーアニメーションテスト開始",
      ]);
      const gestures = getAllGestures();
      for (let i = 0; i < Math.min(gestures.length, 3); i++) {
        const gesture = gestures[i];
        setTestResults((prev) => [...prev, `👋 ${gesture} ジェスチャー実行`]);

        controller.playGestureAnimation(gesture, 0.8);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        controller.stopCurrentGestureAnimation();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setTestResults((prev) => [...prev, "🎉 アニメーションテスト完了"]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ アニメーションテストエラー: ${error}`,
      ]);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * 個別ジェスチャーテスト
   */
  const testGestureByCategory = async (category: "hand" | "head" | "body") => {
    setIsTestRunning(true);

    try {
      const controller = getAnimationController();
      if (!controller) {
        setTestResults((prev) => [
          ...prev,
          "❌ アニメーション制御サービスが利用できません",
        ]);
        return;
      }

      const gestures = getGesturesByCategory(category);
      setTestResults((prev) => [
        ...prev,
        `🎭 ${category}ジェスチャーテスト開始 (${gestures.length}個)`,
      ]);

      for (const gesture of gestures) {
        setTestResults((prev) => [...prev, `👋 ${gesture} 実行中...`]);
        controller.playGestureAnimation(gesture, 1.0);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        controller.stopCurrentGestureAnimation();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      setTestResults((prev) => [
        ...prev,
        `✅ ${category}ジェスチャーテスト完了`,
      ]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ ${category}ジェスチャーテストエラー: ${error}`,
      ]);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * パフォーマンステスト実行
   */
  const runPerformanceTest = async () => {
    if (!performanceTester) {
      setTestResults((prev) => [...prev, "❌ パフォーマンステスター未初期化"]);
      return;
    }

    setIsPerformanceTestRunning(true);
    setTestResults([]);

    try {
      console.log("🧪 パフォーマンステスト開始");
      setTestResults((prev) => [...prev, "🧪 パフォーマンステスト開始..."]);

      const results = await performanceTester.runFullTestSuite();
      setPerformanceTestResults(results);

      // 結果表示
      setTestResults((prev) => [
        ...prev,
        `📊 テスト結果: ${results.summary.passedTests}/${results.summary.totalTests} 成功`,
        `📈 平均フレームレート: ${results.summary.averageFrameRate.toFixed(
          1
        )}fps`,
        `⏱️ 最大計算時間: ${results.summary.maxCalculationTime.toFixed(1)}ms`,
        `💾 最大メモリ使用量: ${results.summary.maxMemoryUsage.toFixed(1)}MB`,
      ]);

      // 個別テスト結果
      results.testResults.forEach((result) => {
        const status = result.success ? "✅" : "❌";
        setTestResults((prev) => [
          ...prev,
          `${status} ${result.testName}: ${result.averageFrameRate.toFixed(
            1
          )}fps`,
        ]);

        if (!result.success) {
          result.issues.forEach((issue) => {
            setTestResults((prev) => [...prev, `  ⚠️ ${issue}`]);
          });
        }
      });

      if (results.overallSuccess) {
        setTestResults((prev) => [...prev, "🎉 全パフォーマンステスト成功！"]);
      } else {
        setTestResults((prev) => [...prev, "⚠️ 一部テストが失敗しました"]);
      }
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        `❌ パフォーマンステストエラー: ${error}`,
      ]);
    } finally {
      setIsPerformanceTestRunning(false);
    }
  };

  /**
   * システムリセット
   */
  const resetSystem = () => {
    lipSyncService.stopLipSync();
    advancedLipSyncService.stopAdvancedLipSync();
    integratedLipSyncService.stopLipSync();
    blendShapeService.resetAllBlendShapes();

    // アニメーション制御サービスもリセット
    const controller = getAnimationController();
    if (controller) {
      controller.stopCurrentEmotionAnimation();
      controller.stopCurrentGestureAnimation();
    }

    setTestResults((prev) => [...prev, "🔄 システムリセット完了"]);
    console.log("システムリセット完了");
  };

  if (!isVisible) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Bug className="w-4 h-4 mr-2" />
          デバッグ
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-80 max-h-[70vh] ${className}`}>
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="w-4 h-4" />
              システムデバッグ
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={runTest}
                title="ブレンドシェイプテスト"
                disabled={isTestRunning}
              >
                <TestTube className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runDemoAnimation}
                title="デモアニメーション"
                disabled={isTestRunning}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runTTSTest}
                title="TTS音声テスト"
                disabled={isTestRunning}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={testManualBlendShape}
                title="手動ブレンドシェイプテスト"
                disabled={isTestRunning}
              >
                🎭
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runAnimationTest}
                title="アニメーションテスト"
                disabled={isTestRunning}
              >
                🎬
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testGestureByCategory("hand")}
                title="手ジェスチャーテスト"
                disabled={isTestRunning}
              >
                👋
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runPerformanceTest}
                title="パフォーマンステスト"
                disabled={isTestRunning || isPerformanceTestRunning}
              >
                📊
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSystem}
                title="システムリセット"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto">
          {/* システム状態 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">システム状態</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                {!!(
                  window.AudioContext ||
                  (
                    window as unknown as {
                      webkitAudioContext: typeof AudioContext;
                    }
                  ).webkitAudioContext
                ) ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                <span>Web Audio</span>
              </div>
              <div className="flex items-center gap-2">
                {blendShapeInfo.hasVRM ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-yellow-500" />
                )}
                <span>VRMモデル</span>
              </div>
            </div>
          </div>

          {/* アクティブサービス */}
          <div className="space-y-2">
            <div className="text-sm font-medium">アクティブサービス</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>基本リップシンク</span>
                <Badge variant={basicStatus.isActive ? "default" : "secondary"}>
                  {basicStatus.isActive ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>高精度リップシンク</span>
                <Badge
                  variant={advancedStatus.isActive ? "default" : "secondary"}
                >
                  {advancedStatus.isActive ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>統合リップシンク</span>
                <Badge
                  variant={integratedStatus.isActive ? "default" : "secondary"}
                >
                  {integratedStatus.isActive ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>アニメーション制御</span>
                <Badge variant={animationController ? "default" : "secondary"}>
                  {animationController ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
          </div>

          {/* サービス詳細 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">詳細情報</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>現在の音素:</span>
                <span className="font-mono">
                  {advancedStatus.currentPhoneme}
                </span>
              </div>
              <div className="flex justify-between">
                <span>信頼度:</span>
                <span>{(advancedStatus.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>感情:</span>
                <span className="font-mono">
                  {integratedStatus.currentEmotion}
                </span>
              </div>
              <div className="flex justify-between">
                <span>TTS状態:</span>
                <Badge
                  variant={
                    integratedStatus.isTTSSpeaking ? "default" : "secondary"
                  }
                >
                  {integratedStatus.isTTSSpeaking ? "話中" : "停止"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>ブレンドシェイプ:</span>
                <span>
                  {blendShapeInfo.availableBlendShapes?.length || 0}個
                </span>
              </div>
              <div className="flex justify-between">
                <span>アクティブ形状:</span>
                <span>{blendShapeInfo.currentActiveShapes}個</span>
              </div>
              {animationController && (
                <>
                  <div className="flex justify-between">
                    <span>アニメーション数:</span>
                    <span>{animationState.activeAnimationCount}個</span>
                  </div>
                  <div className="flex justify-between">
                    <span>フレームレート:</span>
                    <span>{animationState.frameRate.toFixed(0)} fps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>計算時間:</span>
                    <span>{animationState.calculationTime.toFixed(1)} ms</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* パフォーマンステスト結果 */}
          {performanceTestResults && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                パフォーマンステスト結果
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>総合結果:</span>
                  <Badge
                    variant={
                      performanceTestResults.overallSuccess
                        ? "default"
                        : "destructive"
                    }
                  >
                    {performanceTestResults.overallSuccess ? "成功" : "失敗"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>成功率:</span>
                  <span>
                    {performanceTestResults.summary.passedTests}/
                    {performanceTestResults.summary.totalTests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>平均FPS:</span>
                  <span>
                    {performanceTestResults.summary.averageFrameRate.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>最大計算時間:</span>
                  <span>
                    {performanceTestResults.summary.maxCalculationTime.toFixed(
                      1
                    )}
                    ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>最大メモリ:</span>
                  <span>
                    {performanceTestResults.summary.maxMemoryUsage.toFixed(1)}MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* テスト結果 */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">テスト結果</div>
              <div className="max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 実行中のアニメーション */}
          {animationController &&
            Object.values(animationState.runningAnimations).some(Boolean) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  実行中のアニメーション
                </div>
                <div className="space-y-1 text-xs">
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
                </div>
              </div>
            )}

          {/* アクティブなブレンドシェイプ */}
          {Object.entries(blendShapeInfo.currentWeights).filter(
            ([, weight]) => weight > 0.001
          ).length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                アクティブなブレンドシェイプ
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {Object.entries(blendShapeInfo.currentWeights)
                  .filter(([, weight]) => weight > 0.001)
                  .map(([name, weight]) => (
                    <div key={name} className="flex justify-between text-xs">
                      <span className="font-mono">{name}</span>
                      <span className="font-mono">
                        {(weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
