import { AnimationController } from "@/lib/services/animation-controller";
import { EmotionType } from "@/lib/llm/emotion-service";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
import type { VRM } from "@pixiv/three-vrm";

/**
 * 感情ブリッジサービス
 * EmotionStoreの変化を監視してAnimationControllerに感情アニメーションを実行させる
 * Phase 2: 音声合成との統合機能を追加
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

  constructor() {
    this.initializeAnimationController();
    this.setupSpeechIntegration();
  }

  /**
   * AnimationControllerを初期化
   */
  private initializeAnimationController(): void {
    this.animationController = new AnimationController();
    console.log("🌉 EmotionBridgeService: AnimationController初期化完了");
  }

  /**
   * Phase 2: 音声合成統合の初期化
   */
  private setupSpeechIntegration(): void {
    // 統合リップシンクサービスの状態監視
    this.monitorSpeechStatus();
    console.log("🔊 EmotionBridgeService: 音声合成統合初期化完了");
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
        console.log("🔊 音声合成終了検知 - 次の音声キューを処理");
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
      console.log("🌉 EmotionBridgeService: VRMモデル設定完了");
    }
  }

  /**
   * 感情変化を監視して3Dアニメーションを実行
   */
  public handleEmotionChange(emotion: EmotionType, intensity: number): void {
    if (!this.isEnabled || !this.animationController) {
      return;
    }

    // 同じ感情の場合はスキップ（パフォーマンス向上）
    if (
      this.currentEmotion === emotion &&
      Math.abs(this.currentIntensity - intensity) < 0.1
    ) {
      return;
    }

    console.log(`🌉 感情変化検出: ${emotion} (強度: ${intensity})`);

    // 感情アニメーションを実行
    this.animationController.playEmotionAnimation(emotion, intensity);

    // Phase 2: 統合リップシンクサービスにも感情を通知
    if (this.isSpeechIntegrationEnabled) {
      integratedLipSyncService.setEmotionIntensity(intensity);
      console.log("🔊 統合リップシンクサービスに感情強度を通知");
    }

    // 現在の状態を更新
    this.currentEmotion = emotion;
    this.currentIntensity = intensity;
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

    console.log(
      `🎭 AI応答統合処理開始: ${text.substring(0, 30)}... (${emotion})`
    );

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

      console.log(`🎭 AI応答統合処理完了: ${emotion} + 音声合成`);
    } catch (error) {
      console.error("🎭 AI応答統合処理エラー:", error);
      this.isSpeaking = false;
      // エラー時は次のキューを処理
      this.processNextSpeechQueue();
    }
  }

  /**
   * Phase 2: 音声統合機能の有効/無効切り替え
   */
  public setSpeechIntegrationEnabled(enabled: boolean): void {
    this.isSpeechIntegrationEnabled = enabled;
    console.log(`🔊 音声統合機能: ${enabled ? "有効" : "無効"}に設定`);
  }

  /**
   * Phase 2: 音声キューをクリア
   */
  public clearSpeechQueue(): void {
    this.speechQueue = [];
    this.isSpeaking = false;
    console.log("🔊 音声キューをクリア");
  }

  /**
   * サービスの有効/無効を切り替え
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🌉 EmotionBridgeService: ${enabled ? "有効" : "無効"}に設定`);
  }

  /**
   * 現在の感情状態を取得
   */
  public getCurrentEmotionState(): {
    emotion: EmotionType | null;
    intensity: number;
    isEnabled: boolean;
    isSpeechIntegrationEnabled: boolean;
    speechQueueLength: number;
    isSpeaking: boolean;
  } {
    return {
      emotion: this.currentEmotion,
      intensity: this.currentIntensity,
      isEnabled: this.isEnabled,
      isSpeechIntegrationEnabled: this.isSpeechIntegrationEnabled,
      speechQueueLength: this.speechQueue.length,
      isSpeaking: this.isSpeaking,
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
    this.animationController = null;
    this.currentEmotion = null;
    this.currentIntensity = 0;
    this.clearSpeechQueue();
    console.log("🌉 EmotionBridgeService: 破棄完了");
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
