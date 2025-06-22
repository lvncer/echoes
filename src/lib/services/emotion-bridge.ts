import { AnimationController } from "@/lib/services/animation-controller";
import { EmotionType } from "@/lib/llm/emotion-service";
import type { VRM } from "@pixiv/three-vrm";

/**
 * 感情ブリッジサービス
 * EmotionStoreの変化を監視してAnimationControllerに感情アニメーションを実行させる
 */
export class EmotionBridgeService {
  private animationController: AnimationController | null = null;
  private isEnabled = true;
  private currentEmotion: EmotionType | null = null;
  private currentIntensity = 0;

  constructor() {
    this.initializeAnimationController();
  }

  /**
   * AnimationControllerを初期化
   */
  private initializeAnimationController(): void {
    this.animationController = new AnimationController();
    console.log("🌉 EmotionBridgeService: AnimationController初期化完了");
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

    // 現在の状態を更新
    this.currentEmotion = emotion;
    this.currentIntensity = intensity;
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
  } {
    return {
      emotion: this.currentEmotion,
      intensity: this.currentIntensity,
      isEnabled: this.isEnabled,
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
