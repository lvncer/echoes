import { blendShapeService } from "./blend-shape-service";
import {
  phonemeAnalysisService,
  PhonemeAnalysisResult,
} from "./phoneme-analysis-service";

/**
 * 高精度リップシンクサービス
 * 音素解析による15音素対応リップシンク
 */
export class AdvancedLipSyncService {
  private isActive = false;
  private currentPhoneme = "sil";
  private confidence = 0;
  private formants = { f1: 0, f2: 0, f3: 0 };

  // アニメーション制御
  private animationFrame: number | null = null;
  private targetBlendShapes: Record<string, number> = {};
  private currentBlendShapes: Record<string, number> = {};

  // 設定パラメータ
  private sensitivity = 1.0; // 感度調整
  private responsiveness = 0.4; // 応答性（低いほど滑らか）
  private confidenceThreshold = 0.3; // 信頼度閾値
  private blendShapeSmoothing = 0.8; // ブレンドシェイプスムージング

  // 音素遷移制御
  private phonemeHistory: Array<{ phoneme: string; timestamp: number }> = [];
  private maxHistoryLength = 10;
  private transitionDuration = 100; // ms

  // VRMモデル対応
  private availableBlendShapes: string[] = [];

  // ログ出力制御
  private lastLogTime = 0;

  /**
   * 高精度リップシンクを開始
   */
  async startAdvancedLipSync(stream: MediaStream): Promise<void> {
    try {
      // VRMモデルの利用可能なブレンドシェイプを取得
      this.updateAvailableBlendShapes();

      // 音素解析を開始
      await phonemeAnalysisService.startAnalysis(
        stream,
        this.processPhonemeResult.bind(this)
      );

      // アニメーションループを開始
      this.isActive = true;
      this.startAnimationLoop();

      console.log("高精度リップシンク開始");
      console.log("利用可能なブレンドシェイプ:", this.availableBlendShapes);
    } catch (error) {
      console.error("高精度リップシンク開始エラー:", error);
      throw error;
    }
  }

  /**
   * 利用可能なブレンドシェイプを更新
   */
  private updateAvailableBlendShapes(): void {
    this.availableBlendShapes = blendShapeService.getAvailableBlendShapes();
    console.log("ブレンドシェイプ更新:", this.availableBlendShapes);
  }

  /**
   * 高精度リップシンクを停止
   */
  stopAdvancedLipSync(): void {
    this.isActive = false;

    // 音素解析を停止
    phonemeAnalysisService.stopAnalysis();

    // アニメーションループを停止
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // 口をリセット
    this.resetMouth();

    console.log("高精度リップシンク停止");
  }

  /**
   * 音素解析結果を処理
   */
  private processPhonemeResult(result: PhonemeAnalysisResult): void {
    if (!this.isActive) return;

    // 信頼度チェック
    if (result.confidence < this.confidenceThreshold) {
      // 信頼度が低い場合は無音として処理
      this.updatePhoneme("sil", 0, result.formants);
      return;
    }

    // 音素履歴を更新
    this.updatePhonemeHistory(result.phoneme);

    // 音素遷移の安定性をチェック
    const stablePhoneme = this.getStablePhoneme();

    // 音素を更新
    this.updatePhoneme(stablePhoneme, result.confidence, result.formants);
  }

  /**
   * 音素履歴を更新
   */
  private updatePhonemeHistory(phoneme: string): void {
    const now = Date.now();

    // 新しい音素を追加
    this.phonemeHistory.push({ phoneme, timestamp: now });

    // 古い履歴を削除
    this.phonemeHistory = this.phonemeHistory.filter(
      (entry) => now - entry.timestamp < 500 // 500ms以内の履歴のみ保持
    );

    // 最大長を超えた場合は古いものから削除
    if (this.phonemeHistory.length > this.maxHistoryLength) {
      this.phonemeHistory = this.phonemeHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * 安定した音素を取得（ノイズ除去）
   */
  private getStablePhoneme(): string {
    if (this.phonemeHistory.length === 0) {
      return "sil";
    }

    // 最近の音素の出現頻度を計算
    const recentHistory = this.phonemeHistory.slice(-5); // 最新5個
    const phonemeCounts: Record<string, number> = {};

    for (const entry of recentHistory) {
      phonemeCounts[entry.phoneme] = (phonemeCounts[entry.phoneme] || 0) + 1;
    }

    // 最も頻繁に出現する音素を返す
    let maxCount = 0;
    let stablePhoneme = "sil";

    for (const [phoneme, count] of Object.entries(phonemeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        stablePhoneme = phoneme;
      }
    }

    return stablePhoneme;
  }

  /**
   * 音素を更新
   */
  private updatePhoneme(
    phoneme: string,
    confidence: number,
    formants: { f1: number; f2: number; f3: number }
  ): void {
    this.currentPhoneme = phoneme;
    this.confidence = confidence;
    this.formants = formants;

    // 音素に対応するブレンドシェイプを計算
    this.calculateTargetBlendShapes();
  }

  /**
   * ターゲットブレンドシェイプを計算
   */
  private calculateTargetBlendShapes(): void {
    // 音素設定を取得
    const phonemeConfig = phonemeAnalysisService.getPhonemeConfig(
      this.currentPhoneme
    );

    if (!phonemeConfig) {
      // 設定がない場合は無音
      this.targetBlendShapes = {};
      return;
    }

    // 基本ブレンドシェイプを設定（利用可能なもののみ）
    const baseBlendShapes = { ...phonemeConfig.blendShapeMapping };
    const adjustedBlendShapes: Record<string, number> = {};

    // 利用可能なブレンドシェイプのみを使用
    for (const [shape, weight] of Object.entries(baseBlendShapes)) {
      if (this.isBlendShapeAvailable(shape)) {
        adjustedBlendShapes[shape] =
          weight * this.sensitivity * this.confidence;
      } else {
        // 利用可能でない場合は代替ブレンドシェイプを探す
        const alternative = this.findAlternativeBlendShape(shape);
        if (alternative) {
          adjustedBlendShapes[alternative] =
            weight * this.sensitivity * this.confidence;
        }
      }
    }

    // フォルマント情報による微調整
    this.applyFormantAdjustments(adjustedBlendShapes);

    this.targetBlendShapes = adjustedBlendShapes;

    // デバッグログ（5秒間隔で出力）
    const now = Date.now();
    if (now - this.lastLogTime > 5000) {
      console.log(
        `音素: ${this.currentPhoneme}, ターゲット:`,
        this.targetBlendShapes
      );
      this.lastLogTime = now;
    }
  }

  /**
   * ブレンドシェイプが利用可能かチェック
   */
  private isBlendShapeAvailable(shape: string): boolean {
    return this.availableBlendShapes.includes(shape);
  }

  /**
   * 代替ブレンドシェイプを探す
   */
  private findAlternativeBlendShape(shape: string): string | null {
    const alternatives: Record<string, string[]> = {
      // 標準形式 → VRM 1.0形式を優先
      A: ["aa", "あ", "mouth_a", "Mouth_A", "a"],
      I: ["ih", "い", "mouth_i", "Mouth_I", "i"],
      U: ["ou", "う", "mouth_u", "Mouth_U", "u"],
      E: ["ee", "え", "mouth_e", "Mouth_E", "e"],
      O: ["oh", "お", "mouth_o", "Mouth_O", "o"],

      // VRM 1.0形式 → 標準形式
      aa: ["A", "あ", "mouth_a", "Mouth_A", "a"],
      ih: ["I", "い", "mouth_i", "Mouth_I", "i"],
      ou: ["U", "う", "mouth_u", "Mouth_U", "u"],
      ee: ["E", "え", "mouth_e", "Mouth_E", "e"],
      oh: ["O", "お", "mouth_o", "Mouth_O", "o"],
    };

    const possibleAlternatives = alternatives[shape] || [];
    for (const alt of possibleAlternatives) {
      if (this.isBlendShapeAvailable(alt)) {
        return alt;
      }
    }

    return null;
  }

  /**
   * フォルマント情報による微調整
   */
  private applyFormantAdjustments(blendShapes: Record<string, number>): void {
    const { f1, f2 } = this.formants;

    // F1が高い場合は口を大きく開く
    if (f1 > 600) {
      const openFactor = Math.min((f1 - 600) / 300, 0.3); // 最大30%増加
      if (blendShapes.A) blendShapes.A += openFactor;
      if (blendShapes.E) blendShapes.E += openFactor * 0.7;
      if (blendShapes.O) blendShapes.O += openFactor * 0.5;
    }

    // F2が高い場合は前舌音を強調
    if (f2 > 2000) {
      const frontFactor = Math.min((f2 - 2000) / 800, 0.2); // 最大20%増加
      if (blendShapes.I) blendShapes.I += frontFactor;
      if (blendShapes.E) blendShapes.E += frontFactor * 0.8;
    }

    // F2が低い場合は後舌音を強調
    if (f2 < 1000) {
      const backFactor = Math.min((1000 - f2) / 400, 0.2); // 最大20%増加
      if (blendShapes.U) blendShapes.U += backFactor;
      if (blendShapes.O) blendShapes.O += backFactor * 0.8;
    }

    // 値を0-1の範囲にクランプ
    for (const shape in blendShapes) {
      blendShapes[shape] = Math.max(0, Math.min(1, blendShapes[shape]));
    }
  }

  /**
   * アニメーションループ
   */
  private startAnimationLoop(): void {
    const animate = (): void => {
      if (!this.isActive) return;

      // スムーズなブレンドシェイプ遷移
      this.updateCurrentBlendShapes();

      // ブレンドシェイプを適用
      this.applyBlendShapes();

      // 次のフレームをスケジュール（30FPS）
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * 現在のブレンドシェイプを更新（スムージング）
   */
  private updateCurrentBlendShapes(): void {
    // VRM 1.0形式も含めた全ての可能なブレンドシェイプをチェック
    const allShapes = ["A", "I", "U", "E", "O", "aa", "ih", "ou", "ee", "oh"];

    for (const shape of allShapes) {
      const target = this.targetBlendShapes[shape] || 0;
      const current = this.currentBlendShapes[shape] || 0;

      // スムーズな遷移
      const diff = target - current;
      this.currentBlendShapes[shape] =
        current + diff * this.responsiveness * this.blendShapeSmoothing;

      // 非常に小さい値は0にする
      if (Math.abs(this.currentBlendShapes[shape]) < 0.001) {
        this.currentBlendShapes[shape] = 0;
      }
    }
  }

  /**
   * ブレンドシェイプを適用
   */
  private applyBlendShapes(): void {
    // 0でないブレンドシェイプのみを適用
    const activeBlendShapes: Record<string, number> = {};
    for (const [shape, weight] of Object.entries(this.currentBlendShapes)) {
      if (weight > 0.001) {
        activeBlendShapes[shape] = weight;
      }
    }

    blendShapeService.setMultipleBlendShapes(activeBlendShapes);
  }

  /**
   * 口をリセット
   */
  private resetMouth(): void {
    this.currentPhoneme = "sil";
    this.confidence = 0;
    this.formants = { f1: 0, f2: 0, f3: 0 };
    this.targetBlendShapes = {};
    this.currentBlendShapes = {};
    this.phonemeHistory = [];

    // VRM 1.0形式も含めた全てのブレンドシェイプをリセット
    const resetWeights = {
      A: 0,
      I: 0,
      U: 0,
      E: 0,
      O: 0,
      aa: 0,
      ih: 0,
      ou: 0,
      ee: 0,
      oh: 0,
    };

    blendShapeService.setMultipleBlendShapes(resetWeights);
  }

  /**
   * 設定を更新
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
  }

  setResponsiveness(responsiveness: number): void {
    this.responsiveness = Math.max(0.1, Math.min(1.0, responsiveness));
  }

  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
  }

  setBlendShapeSmoothing(smoothing: number): void {
    this.blendShapeSmoothing = Math.max(0.1, Math.min(1.0, smoothing));
  }

  /**
   * 状態を取得
   */
  getStatus(): {
    isActive: boolean;
    currentPhoneme: string;
    confidence: number;
    formants: { f1: number; f2: number; f3: number };
    sensitivity: number;
    responsiveness: number;
    confidenceThreshold: number;
    blendShapeSmoothing: number;
  } {
    return {
      isActive: this.isActive,
      currentPhoneme: this.currentPhoneme,
      confidence: this.confidence,
      formants: this.formants,
      sensitivity: this.sensitivity,
      responsiveness: this.responsiveness,
      confidenceThreshold: this.confidenceThreshold,
      blendShapeSmoothing: this.blendShapeSmoothing,
    };
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    advancedLipSync: ReturnType<AdvancedLipSyncService["getStatus"]>;
    phonemeAnalysis: ReturnType<
      typeof phonemeAnalysisService.getAnalysisStatus
    >;
    blendShape: ReturnType<typeof blendShapeService.getVRMInfo>;
    phonemeHistory: Array<{ phoneme: string; timestamp: number }>;
    currentBlendShapes: Record<string, number>;
    targetBlendShapes: Record<string, number>;
  } {
    return {
      advancedLipSync: this.getStatus(),
      phonemeAnalysis: phonemeAnalysisService.getAnalysisStatus(),
      blendShape: blendShapeService.getVRMInfo(),
      phonemeHistory: [...this.phonemeHistory],
      currentBlendShapes: { ...this.currentBlendShapes },
      targetBlendShapes: { ...this.targetBlendShapes },
    };
  }
}

// シングルトンインスタンス
export const advancedLipSyncService = new AdvancedLipSyncService();
