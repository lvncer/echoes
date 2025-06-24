import { AnimationController } from "@/lib/services/animation-controller";
import { EmotionType } from "@/lib/llm/emotion-service";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
import type { VRM } from "@pixiv/three-vrm";

/**
 * 感情ブリッジサービス
 * EmotionStoreの変化を監視してAnimationControllerに感情アニメーションを実行させる
 * Phase 2: 音声合成との統合機能を追加
 * Phase 3: 感情遷移の自然化とアイドルアニメーション
 */
export class EmotionBridgeService {
  private animationController: AnimationController | null = null;
  private isEnabled = true;
  private currentEmotion: EmotionType | null = null;
  private currentIntensity = 0;

  // Phase 2: 音声合成統合機能
  private isSpeechIntegrationEnabled = true;
  private speechQueue: Array<{
    text: string;
    emotion: EmotionType;
    intensity: number;
  }> = [];
  private isSpeaking = false;

  // Phase 3: 感情遷移とアイドルアニメーション
  private emotionTransitionEnabled = true;
  private transitionDuration = 1500; // ms
  private isTransitioning = false;
  private transitionTimer: NodeJS.Timeout | null = null;

  // アイドルアニメーション
  private idleAnimationEnabled = true;
  private idleTimer: NodeJS.Timeout | null = null;
  private lastActivityTime = Date.now();
  private idleThreshold = 10000; // 10秒でアイドル状態
  private idleAnimationInterval = 3000; // 3秒間隔でアイドルアニメーション

  constructor() {
    this.initializeAnimationController();
    this.setupSpeechIntegration();
    this.startIdleMonitoring();
  }

  /**
   * AnimationControllerを初期化
   */
  private initializeAnimationController(): void {
    this.animationController = new AnimationController();
  }

  /**
   * Phase 2: 音声合成統合の初期化
   */
  private setupSpeechIntegration(): void {
    // 統合リップシンクサービスの状態監視
    this.monitorSpeechStatus();
  }

  /**
   * Phase 3: アイドル状態の監視を開始
   */
  private startIdleMonitoring(): void {
    const checkIdleState = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivityTime;

      // アイドル状態の判定
      if (
        this.idleAnimationEnabled &&
        !this.isSpeaking &&
        !this.isTransitioning &&
        timeSinceLastActivity > this.idleThreshold
      ) {
        this.playIdleAnimation();
      }

      // 次回チェックをスケジュール
      setTimeout(checkIdleState, this.idleAnimationInterval);
    };

    checkIdleState();
  }

  /**
   * Phase 3: アイドルアニメーションを再生
   */
  private playIdleAnimation(): void {
    if (!this.animationController || !this.idleAnimationEnabled) {
      return;
    }

    // アイドル時の微細な動き
    const idleAnimations: Array<{
      emotion: EmotionType;
      intensity: number;
      duration: number;
    }> = [
      { emotion: "neutral", intensity: 0.1, duration: 2000 },
      { emotion: "happy", intensity: 0.05, duration: 1000 }, // 微笑み
      { emotion: "neutral", intensity: 0.1, duration: 1500 },
    ];

    const randomAnimation =
      idleAnimations[Math.floor(Math.random() * idleAnimations.length)];


    // 短時間の微細なアニメーション
    this.animationController.playEmotionAnimation(
      randomAnimation.emotion,
      randomAnimation.intensity
    );

    // 元の状態に戻す
    setTimeout(() => {
      if (this.animationController && this.currentEmotion) {
        this.animationController.playEmotionAnimation(
          this.currentEmotion,
          this.currentIntensity * 0.3 // アイドル時は強度を下げる
        );
      }
    }, randomAnimation.duration);
  }

  /**
   * Phase 3: 活動時間を更新
   */
  private updateActivityTime(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Phase 2: 音声合成状態の監視
   */
  private monitorSpeechStatus(): void {
    const checkStatus = () => {
      const lipSyncStatus = integratedLipSyncService.getStatus();

      // TTS音声終了検知
      if (this.isSpeaking && !lipSyncStatus.isTTSSpeaking) {
        this.isSpeaking = false;
        this.processNextSpeechQueue();
      }

      // 継続監視
      setTimeout(checkStatus, 500);
    };

    checkStatus();
  }

  /**
   * VRMモデルを設定
   */
  public setVRMModel(vrm: VRM): void {
    if (this.animationController) {
      this.animationController.setVRMModel(vrm);
    }
  }

  /**
   * 感情変化を監視して3Dアニメーションを実行
   * Phase 3: 感情遷移の自然化を追加
   */
  public handleEmotionChange(emotion: EmotionType, intensity: number): void {
    if (!this.isEnabled || !this.animationController) {
      return;
    }

    // Phase 3: 活動時間を更新
    this.updateActivityTime();

    // 同じ感情の場合はスキップ（パフォーマンス向上）
    if (
      this.currentEmotion === emotion &&
      Math.abs(this.currentIntensity - intensity) < 0.1
    ) {
      return;
    }


    // Phase 3: 感情遷移の自然化
    if (
      this.emotionTransitionEnabled &&
      this.currentEmotion &&
      this.currentEmotion !== emotion
    ) {
      this.performSmoothEmotionTransition(emotion, intensity);
    } else {
      // 通常の感情アニメーション
      this.animationController.playEmotionAnimation(emotion, intensity);
    }

    // Phase 2: 統合リップシンクサービスにも感情を通知
    if (this.isSpeechIntegrationEnabled) {
      integratedLipSyncService.setEmotionIntensity(intensity);
    }

    // 現在の状態を更新
    this.currentEmotion = emotion;
    this.currentIntensity = intensity;
  }

  /**
   * Phase 3: スムーズな感情遷移を実行
   */
  private performSmoothEmotionTransition(
    targetEmotion: EmotionType,
    targetIntensity: number
  ): void {
    if (this.isTransitioning) {
      // 既に遷移中の場合は前の遷移をキャンセル
      if (this.transitionTimer) {
        clearTimeout(this.transitionTimer);
      }
    }

    this.isTransitioning = true;

    // 段階的な遷移（3段階）
    const steps = 3;
    const stepDuration = this.transitionDuration / steps;
    let currentStep = 0;

    const executeTransitionStep = () => {
      if (!this.animationController) return;

      currentStep++;
      const progress = currentStep / steps;

      // 現在の感情から目標感情への段階的変化
      if (currentStep < steps) {
        // 中間段階：現在の感情を徐々に弱める
        const currentIntensity = this.currentIntensity * (1 - progress);
        this.animationController.playEmotionAnimation(
          this.currentEmotion!,
          currentIntensity
        );


        this.transitionTimer = setTimeout(executeTransitionStep, stepDuration);
      } else {
        // 最終段階：目標感情を適用
        this.animationController.playEmotionAnimation(
          targetEmotion,
          targetIntensity
        );
        this.isTransitioning = false;
      }
    };

    executeTransitionStep();
  }

  /**
   * Phase 2: AI応答時の音声合成と感情表現の統合制御
   */
  public async handleAIResponseWithSpeech(
    text: string,
    emotion: EmotionType,
    intensity: number
  ): Promise<void> {
    if (!this.isSpeechIntegrationEnabled) {
      // 音声統合が無効の場合は通常の感情変化のみ
      this.handleEmotionChange(emotion, intensity);
      return;
    }

    // 音声キューに追加
    this.speechQueue.push({ text, emotion, intensity });

    // 現在話していない場合は即座に処理
    if (!this.isSpeaking) {
      this.processNextSpeechQueue();
    }
  }

  /**
   * Phase 2: 音声キューの処理
   */
  private async processNextSpeechQueue(): Promise<void> {
    if (this.speechQueue.length === 0 || this.isSpeaking) {
      return;
    }

    const { text, emotion, intensity } = this.speechQueue.shift()!;
    this.isSpeaking = true;

    try {
      // 1. 感情アニメーションを実行
      this.handleEmotionChange(emotion, intensity);

      // 2. 音声合成とリップシンクを開始
      await integratedLipSyncService.startAIResponseLipSync(text, emotion);
    } catch {
      this.isSpeaking = false;
      // エラー時は次のキューを処理
      this.processNextSpeechQueue();
    }
  }

  /**
   * Phase 3: 感情遷移機能の有効/無効切り替え
   */
  public setEmotionTransitionEnabled(enabled: boolean): void {
    this.emotionTransitionEnabled = enabled;
  }

  /**
   * Phase 3: 遷移時間の設定
   */
  public setTransitionDuration(duration: number): void {
    this.transitionDuration = Math.max(500, Math.min(5000, duration)); // 0.5-5秒の範囲
  }

  /**
   * Phase 3: アイドルアニメーション機能の有効/無効切り替え
   */
  public setIdleAnimationEnabled(enabled: boolean): void {
    this.idleAnimationEnabled = enabled;
  }

  /**
   * Phase 3: アイドル閾値の設定
   */
  public setIdleThreshold(threshold: number): void {
    this.idleThreshold = Math.max(5000, threshold); // 最低5秒
  }

  /**
   * Phase 2: 音声統合機能の有効/無効切り替え
   */
  public setSpeechIntegrationEnabled(enabled: boolean): void {
    this.isSpeechIntegrationEnabled = enabled;
  }

  /**
   * Phase 2: 音声キューをクリア
   */
  public clearSpeechQueue(): void {
    this.speechQueue = [];
    this.isSpeaking = false;
  }

  /**
   * サービスの有効/無効を切り替え
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 現在の感情状態を取得
   * Phase 3: 遷移・アイドル状態を追加
   */
  public getCurrentEmotionState(): {
    emotion: EmotionType | null;
    intensity: number;
    isEnabled: boolean;
    isSpeechIntegrationEnabled: boolean;
    speechQueueLength: number;
    isSpeaking: boolean;
    // Phase 3追加
    isTransitioning: boolean;
    emotionTransitionEnabled: boolean;
    transitionDuration: number;
    idleAnimationEnabled: boolean;
    idleThreshold: number;
    timeSinceLastActivity: number;
  } {
    return {
      emotion: this.currentEmotion,
      intensity: this.currentIntensity,
      isEnabled: this.isEnabled,
      isSpeechIntegrationEnabled: this.isSpeechIntegrationEnabled,
      speechQueueLength: this.speechQueue.length,
      isSpeaking: this.isSpeaking,
      // Phase 3追加
      isTransitioning: this.isTransitioning,
      emotionTransitionEnabled: this.emotionTransitionEnabled,
      transitionDuration: this.transitionDuration,
      idleAnimationEnabled: this.idleAnimationEnabled,
      idleThreshold: this.idleThreshold,
      timeSinceLastActivity: Date.now() - this.lastActivityTime,
    };
  }

  /**
   * 感情をニュートラルにリセット
   */
  public resetEmotion(): void {
    this.handleEmotionChange("neutral", 0.5);
  }

  /**
   * サービスを破棄
   */
  public dispose(): void {
    // タイマーをクリア
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.animationController = null;
    this.currentEmotion = null;
    this.currentIntensity = 0;
    this.clearSpeechQueue();
  }
}

// シングルトンインスタンス
let emotionBridgeInstance: EmotionBridgeService | null = null;

/**
 * 感情ブリッジサービスのシングルトンインスタンスを取得
 */
export function getEmotionBridge(): EmotionBridgeService {
  if (!emotionBridgeInstance) {
    emotionBridgeInstance = new EmotionBridgeService();
  }
  return emotionBridgeInstance;
}
