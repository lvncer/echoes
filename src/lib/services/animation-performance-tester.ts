import { AnimationController } from "./animation-controller";
import { getAllGestures } from "../animations/gesture-animations";

export interface PerformanceTestResult {
  testName: string;
  duration: number; // ms
  averageFrameRate: number;
  minFrameRate: number;
  maxFrameRate: number;
  averageCalculationTime: number;
  maxCalculationTime: number;
  averageMemoryUsage: number;
  maxMemoryUsage: number;
  maxActiveAnimations: number;
  success: boolean;
  issues: string[];
}

export interface PerformanceTestSuite {
  testResults: PerformanceTestResult[];
  overallSuccess: boolean;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageFrameRate: number;
    maxCalculationTime: number;
    maxMemoryUsage: number;
  };
}

export class AnimationPerformanceTester {
  private animationController: AnimationController;
  private testDuration = 5000; // 5秒間のテスト

  constructor(animationController: AnimationController) {
    this.animationController = animationController;
  }

  /**
   * 全パフォーマンステストを実行
   */
  public async runFullTestSuite(): Promise<PerformanceTestSuite> {

    const testResults: PerformanceTestResult[] = [];

    // 1. 基本アニメーションテスト
    testResults.push(await this.testBasicAnimations());

    // 2. 感情アニメーションテスト
    testResults.push(await this.testEmotionAnimations());

    // 3. ジェスチャーアニメーションテスト
    testResults.push(await this.testGestureAnimations());

    // 4. 同時実行テスト
    testResults.push(await this.testConcurrentAnimations());

    // 5. 長時間実行テスト
    testResults.push(await this.testLongRunning());

    // 6. メモリリークテスト
    testResults.push(await this.testMemoryLeak());

    // 結果集計
    const passedTests = testResults.filter((r) => r.success).length;
    const overallSuccess = passedTests === testResults.length;

    const summary = {
      totalTests: testResults.length,
      passedTests,
      failedTests: testResults.length - passedTests,
      averageFrameRate:
        testResults.reduce((sum, r) => sum + r.averageFrameRate, 0) /
        testResults.length,
      maxCalculationTime: Math.max(
        ...testResults.map((r) => r.maxCalculationTime)
      ),
      maxMemoryUsage: Math.max(...testResults.map((r) => r.maxMemoryUsage)),
    };


    return {
      testResults,
      overallSuccess,
      summary,
    };
  }

  /**
   * 基本アニメーション（瞬き・呼吸）のパフォーマンステスト
   */
  private async testBasicAnimations(): Promise<PerformanceTestResult> {

    // テスト開始
    this.animationController.startAutoBlinking();
    this.animationController.startBreathingAnimation();

    const result = await this.runPerformanceTest(
      "基本アニメーション",
      async () => {
        // 特別な処理なし - 自動実行をテスト
      }
    );

    // クリーンアップ
    this.animationController.stopAutoBlinking();
    this.animationController.stopBreathingAnimation();

    return result;
  }

  /**
   * 感情アニメーションのパフォーマンステスト
   */
  private async testEmotionAnimations(): Promise<PerformanceTestResult> {

    const emotions: Array<"neutral" | "happy" | "sad" | "angry" | "surprised"> =
      ["neutral", "happy", "sad", "angry", "surprised"];

    const result = await this.runPerformanceTest(
      "感情アニメーション",
      async () => {
        for (let i = 0; i < 10; i++) {
          const emotion = emotions[i % emotions.length];
          this.animationController.playEmotionAnimation(emotion, 0.8);
          await this.wait(500); // 0.5秒間隔
        }
      }
    );

    return result;
  }

  /**
   * ジェスチャーアニメーションのパフォーマンステスト
   */
  private async testGestureAnimations(): Promise<PerformanceTestResult> {

    const gestures = getAllGestures();

    const result = await this.runPerformanceTest(
      "ジェスチャーアニメーション",
      async () => {
        for (let i = 0; i < 15; i++) {
          const gesture = gestures[i % gestures.length];
          this.animationController.playGestureAnimation(gesture, 0.7);
          await this.wait(300); // 0.3秒間隔
        }
      }
    );

    return result;
  }

  /**
   * 同時実行アニメーションのパフォーマンステスト
   */
  private async testConcurrentAnimations(): Promise<PerformanceTestResult> {

    const result = await this.runPerformanceTest(
      "同時実行アニメーション",
      async () => {
        // 基本アニメーション開始
        this.animationController.startAutoBlinking();
        this.animationController.startBreathingAnimation();

        // 感情とジェスチャーを同時実行
        for (let i = 0; i < 8; i++) {
          this.animationController.playEmotionAnimation("happy", 0.6);
          this.animationController.playGestureAnimation("pointRight", 0.8);
          await this.wait(600); // 0.6秒間隔
        }
      }
    );

    // クリーンアップ
    this.animationController.stopAutoBlinking();
    this.animationController.stopBreathingAnimation();

    return result;
  }

  /**
   * 長時間実行テスト
   */
  private async testLongRunning(): Promise<PerformanceTestResult> {

    const originalTestDuration = this.testDuration;
    this.testDuration = 10000; // 10秒間

    const result = await this.runPerformanceTest("長時間実行", async () => {
      // 全機能を有効化
      this.animationController.startAutoBlinking();
      this.animationController.startBreathingAnimation();

      // 連続的にアニメーション実行
      const interval = setInterval(() => {
        this.animationController.playEmotionAnimation("happy", 0.5);
        this.animationController.playGestureAnimation("wave", 0.6);
      }, 1000);

      await this.wait(this.testDuration);
      clearInterval(interval);
    });

    this.testDuration = originalTestDuration;

    // クリーンアップ
    this.animationController.stopAutoBlinking();
    this.animationController.stopBreathingAnimation();

    return result;
  }

  /**
   * メモリリークテスト
   */
  private async testMemoryLeak(): Promise<PerformanceTestResult> {

    const initialMemory = this.getCurrentMemoryUsage();

    const result = await this.runPerformanceTest("メモリリーク", async () => {
      // 大量のアニメーション作成・削除を繰り返す
      for (let i = 0; i < 50; i++) {
        this.animationController.playEmotionAnimation("surprised", 0.8);
        this.animationController.playGestureAnimation("clap", 0.9);
        await this.wait(100);
        this.animationController.stopCurrentEmotionAnimation();
        this.animationController.stopCurrentGestureAnimation();
        await this.wait(50);
      }
    });

    const finalMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    // メモリ増加が10MB以下なら成功
    if (memoryIncrease > 10) {
      result.success = false;
      result.issues.push(
        `メモリリーク検出: ${memoryIncrease.toFixed(1)}MB増加`
      );
    }

    return result;
  }

  /**
   * パフォーマンステストを実行
   */
  private async runPerformanceTest(
    testName: string,
    testFunction: () => Promise<void>
  ): Promise<PerformanceTestResult> {
    // パフォーマンス履歴をクリア
    const startTime = performance.now();

    // テスト実行
    await testFunction();

    // 結果収集
    await this.wait(1000); // 1秒待機してデータ収集

    const endTime = performance.now();
    const duration = endTime - startTime;

    const stats = this.animationController.getPerformanceStats();

    // 成功判定
    const issues: string[] = [];
    let success = true;

    // フレームレート要件: 25fps以上
    if (stats.averageFrameRate < 25) {
      success = false;
      issues.push(
        `フレームレート不足: ${stats.averageFrameRate.toFixed(1)}fps < 25fps`
      );
    }

    // CPU負荷要件: 10ms以下
    if (stats.maxCalculationTime > 10) {
      success = false;
      issues.push(
        `CPU負荷超過: ${stats.maxCalculationTime.toFixed(1)}ms > 10ms`
      );
    }

    // メモリ使用量要件: 100MB以下
    if (stats.maxMemoryUsage > 100) {
      success = false;
      issues.push(
        `メモリ使用量超過: ${stats.maxMemoryUsage.toFixed(1)}MB > 100MB`
      );
    }

    return {
      testName,
      duration,
      averageFrameRate: stats.averageFrameRate,
      minFrameRate: Math.min(
        ...this.animationController
          .getPerformanceHistory()
          .map((h) => h.frameRate)
      ),
      maxFrameRate: Math.max(
        ...this.animationController
          .getPerformanceHistory()
          .map((h) => h.frameRate)
      ),
      averageCalculationTime: stats.averageCalculationTime,
      maxCalculationTime: stats.maxCalculationTime,
      averageMemoryUsage: stats.averageMemoryUsage,
      maxMemoryUsage: stats.maxMemoryUsage,
      maxActiveAnimations: Math.max(
        ...this.animationController
          .getPerformanceHistory()
          .map((h) => h.activeAnimations)
      ),
      success,
      issues,
    };
  }

  /**
   * 現在のメモリ使用量を取得
   */
  private getCurrentMemoryUsage(): number {
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } })
        .memory;
      if (memory) {
        return memory.usedJSHeapSize / 1024 / 1024; // MB
      }
    }
    return 0;
  }

  /**
   * 指定時間待機
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
