import { blendShapeService } from "./blend-shape-service";
import {
  audioAnalysisService,
  AudioAnalysisService,
} from "./audio-analysis-service";

/**
 * リップシンク制御サービス
 * 音声解析結果をVRMブレンドシェイプに反映する
 */
export class LipSyncService {
  private isActive = false;
  private currentPhoneme = "sil";
  private mouthOpeningLevel = 0;

  // リップシンク設定
  private sensitivity = 1.0; // 感度調整
  private responsiveness = 0.3; // 応答性（低いほど滑らか）
  private volumeThreshold = 0.02; // 音量閾値

  // アニメーション制御
  private animationFrame: number | null = null;
  private targetMouthOpening = 0;
  private currentMouthOpening = 0;

  /**
   * リップシンクを開始
   */
  async startLipSync(stream: MediaStream): Promise<void> {
    try {
      // 音声解析を開始
      await audioAnalysisService.startAnalysis(stream);

      // 音量コールバックを設定
      audioAnalysisService.setVolumeCallback((volume) => {
        this.processVolumeLevel(volume);
      });

      // 音量閾値を設定
      audioAnalysisService.setVolumeThreshold(this.volumeThreshold);

      // アニメーションループを開始
      this.isActive = true;
      this.startAnimationLoop();

      console.log("リップシンク開始");
    } catch (error) {
      console.error("リップシンク開始エラー:", error);
      throw error;
    }
  }

  /**
   * リップシンクを停止
   */
  stopLipSync(): void {
    this.isActive = false;

    // 音声解析を停止
    audioAnalysisService.stopAnalysis();

    // アニメーションループを停止
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // 口を閉じる
    this.resetMouth();

    console.log("リップシンク停止");
  }

  /**
   * 音量レベルを処理してリップシンクに反映
   */
  private processVolumeLevel(volume: number): void {
    if (!this.isActive) return;

    // 感度を適用
    const adjustedVolume = volume * this.sensitivity;

    // 音量から口の開き具合を計算
    this.targetMouthOpening =
      AudioAnalysisService.volumeToMouthOpening(adjustedVolume);

    // 音量から基本音素を推定
    this.currentPhoneme =
      AudioAnalysisService.volumeToBasicPhoneme(adjustedVolume);
  }

  /**
   * アニメーションループ
   */
  private startAnimationLoop(): void {
    const animate = (): void => {
      if (!this.isActive) return;

      // スムーズな口の動きを実現
      const diff = this.targetMouthOpening - this.currentMouthOpening;
      this.currentMouthOpening += diff * this.responsiveness;

      // ブレンドシェイプを更新
      this.updateBlendShapes();

      // 次のフレームをスケジュール
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * ブレンドシェイプを更新
   */
  private updateBlendShapes(): void {
    // 現在の音素に基づいてブレンドシェイプを設定
    const blendShapeWeights: Record<string, number> = {};

    // 基本的な口の形を設定
    switch (this.currentPhoneme) {
      case "sil":
        // 無音時は口を閉じる
        break;
      case "A":
        blendShapeWeights.A = this.currentMouthOpening;
        break;
      case "I":
        blendShapeWeights.I = this.currentMouthOpening;
        break;
      case "U":
        blendShapeWeights.U = this.currentMouthOpening;
        break;
      case "E":
        blendShapeWeights.E = this.currentMouthOpening;
        break;
      case "O":
        blendShapeWeights.O = this.currentMouthOpening;
        break;
      default:
        // デフォルトは「A」の形
        blendShapeWeights.A = this.currentMouthOpening * 0.5;
        break;
    }

    // ブレンドシェイプを適用
    blendShapeService.setMultipleBlendShapes(blendShapeWeights);
  }

  /**
   * 口をリセット（閉じる）
   */
  private resetMouth(): void {
    this.currentMouthOpening = 0;
    this.targetMouthOpening = 0;
    this.currentPhoneme = "sil";

    // 口関連のブレンドシェイプをリセット
    const resetWeights = {
      A: 0,
      I: 0,
      U: 0,
      E: 0,
      O: 0,
    };

    blendShapeService.setMultipleBlendShapes(resetWeights);
  }

  /**
   * 感度を設定
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
  }

  /**
   * 応答性を設定
   */
  setResponsiveness(responsiveness: number): void {
    this.responsiveness = Math.max(0.1, Math.min(1.0, responsiveness));
  }

  /**
   * 音量閾値を設定
   */
  setVolumeThreshold(threshold: number): void {
    this.volumeThreshold = Math.max(0.001, Math.min(0.5, threshold));
    audioAnalysisService.setVolumeThreshold(this.volumeThreshold);
  }

  /**
   * リップシンク状態を取得
   */
  getStatus(): {
    isActive: boolean;
    currentPhoneme: string;
    mouthOpeningLevel: number;
    sensitivity: number;
    responsiveness: number;
    volumeThreshold: number;
  } {
    return {
      isActive: this.isActive,
      currentPhoneme: this.currentPhoneme,
      mouthOpeningLevel: this.currentMouthOpening,
      sensitivity: this.sensitivity,
      responsiveness: this.responsiveness,
      volumeThreshold: this.volumeThreshold,
    };
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    lipSync: ReturnType<LipSyncService["getStatus"]>;
    audioAnalysis: ReturnType<typeof audioAnalysisService.getDebugInfo>;
    blendShape: ReturnType<typeof blendShapeService.getVRMInfo>;
  } {
    return {
      lipSync: this.getStatus(),
      audioAnalysis: audioAnalysisService.getDebugInfo(),
      blendShape: blendShapeService.getVRMInfo(),
    };
  }

  /**
   * TTS音声との同期（将来の拡張用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  syncWithTTS(_audioElement: HTMLAudioElement): void {
    // TTS音声の再生に合わせてリップシンクを制御
    // 将来的にはここでTTS音声の解析を行う
    console.log("TTS同期機能は今後実装予定");
  }
}

// シングルトンインスタンス
export const lipSyncService = new LipSyncService();
