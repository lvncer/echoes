import { VRM } from "@pixiv/three-vrm";

/**
 * VRMブレンドシェイプ制御サービス
 * VRMモデルの表情・口の形を制御する
 */
export class VRMBlendShapeService {
  private vrm: VRM | null = null;
  private currentWeights: Record<string, number> = {};

  /**
   * VRMモデルを設定
   */
  setVRM(vrm: VRM): void {
    this.vrm = vrm;
    this.resetAllBlendShapes();

    // デバッグ: 利用可能なブレンドシェイプを確認
    console.log(
      "VRM設定完了。利用可能なブレンドシェイプ:",
      this.getAvailableBlendShapes()
    );
  }

  /**
   * VRMモデルを取得
   */
  getVRM(): VRM | null {
    return this.vrm;
  }

  /**
   * ブレンドシェイプのウェイトを設定
   */
  setBlendShapeWeight(name: string, weight: number): void {
    if (!this.vrm?.expressionManager) {
      console.warn("VRM expressionManager is not available");
      return;
    }

    try {
      // ウェイトを0-1の範囲にクランプ
      const clampedWeight = Math.max(0, Math.min(1, weight));

      // ブレンドシェイプを設定
      this.vrm.expressionManager.setValue(name, clampedWeight);

      // 現在のウェイトを記録
      this.currentWeights[name] = clampedWeight;

      // 更新を適用
      this.vrm.expressionManager.update();

      // デバッグログ
      console.log(`ブレンドシェイプ設定: ${name} = ${clampedWeight}`);
    } catch (error) {
      console.warn(`Failed to set blend shape ${name}:`, error);
    }
  }

  /**
   * 利用可能なブレンドシェイプ名を取得
   */
  getAvailableBlendShapes(): string[] {
    if (!this.vrm?.expressionManager) {
      return [];
    }

    try {
      // VRMモデルから実際に利用可能なブレンドシェイプを取得
      const expressions = this.vrm.expressionManager.expressions;
      const availableShapes: string[] = [];

      // expressionsオブジェクトからキーを取得
      if (expressions) {
        for (const [key] of Object.entries(expressions)) {
          availableShapes.push(key);
        }
      }

      // 利用可能なブレンドシェイプが見つからない場合は標準的な名前を試す
      if (availableShapes.length === 0) {
        const standardShapes = [
          "A",
          "I",
          "U",
          "E",
          "O",
          "aa",
          "ih",
          "ou",
          "ee",
          "oh", // VRM 1.0形式
          "Joy",
          "Angry",
          "Sorrow",
          "Fun",
          "happy",
          "angry",
          "sad",
          "surprised", // 英語名
          "Blink",
          "BlinkL",
          "BlinkR",
          "blink",
          "blinkLeft",
          "blinkRight", // 英語名
          "LookUp",
          "LookDown",
          "LookLeft",
          "LookRight",
          "lookUp",
          "lookDown",
          "lookLeft",
          "lookRight", // 英語名
        ];

        // 実際に設定可能かテストして追加
        for (const shape of standardShapes) {
          if (this.testBlendShapeAvailability(shape)) {
            availableShapes.push(shape);
          }
        }
      }

      console.log("利用可能なブレンドシェイプ:", availableShapes);
      return availableShapes;
    } catch (error) {
      console.warn("Failed to get available blend shapes:", error);
      return [];
    }
  }

  /**
   * ブレンドシェイプが設定可能かテスト
   */
  private testBlendShapeAvailability(name: string): boolean {
    if (!this.vrm?.expressionManager) {
      return false;
    }

    try {
      // 現在の値を保存
      const currentValue = this.vrm.expressionManager.getValue(name) || 0;

      // テスト用に設定
      this.vrm.expressionManager.setValue(name, 0.1);
      const testValue = this.vrm.expressionManager.getValue(name) || 0;

      // 元の値に戻す
      this.vrm.expressionManager.setValue(name, currentValue);

      // 設定が反映されたかチェック
      return Math.abs(testValue - 0.1) < 0.01;
    } catch {
      return false;
    }
  }

  /**
   * 現在のブレンドシェイプウェイトを取得
   */
  getCurrentWeights(): Record<string, number> {
    return { ...this.currentWeights };
  }

  /**
   * 特定のブレンドシェイプのウェイトを取得
   */
  getBlendShapeWeight(name: string): number {
    return this.currentWeights[name] || 0;
  }

  /**
   * すべてのブレンドシェイプをリセット
   */
  resetAllBlendShapes(): void {
    if (!this.vrm?.expressionManager) {
      return;
    }

    try {
      // 利用可能なブレンドシェイプをすべて0にリセット
      const availableShapes = this.getAvailableBlendShapes();
      availableShapes.forEach((shape) => {
        this.vrm!.expressionManager!.setValue(shape, 0);
        this.currentWeights[shape] = 0;
      });

      this.vrm.expressionManager.update();
    } catch (error) {
      console.warn("Failed to reset blend shapes:", error);
    }
  }

  /**
   * 複数のブレンドシェイプを一度に設定
   */
  setMultipleBlendShapes(weights: Record<string, number>): void {
    if (!this.vrm?.expressionManager) {
      return;
    }

    try {
      Object.entries(weights).forEach(([name, weight]) => {
        const clampedWeight = Math.max(0, Math.min(1, weight));
        this.vrm!.expressionManager!.setValue(name, clampedWeight);
        this.currentWeights[name] = clampedWeight;
      });

      this.vrm.expressionManager.update();
    } catch (error) {
      console.warn("Failed to set multiple blend shapes:", error);
    }
  }

  /**
   * ブレンドシェイプが利用可能かチェック
   */
  isBlendShapeAvailable(name: string): boolean {
    if (!this.vrm?.expressionManager) {
      return false;
    }

    try {
      // テスト用に一時的に設定してみる
      this.vrm.expressionManager.setValue(name, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * VRMモデルの基本情報を取得
   */
  getVRMInfo(): {
    hasBlendShapeProxy: boolean;
    availableShapesCount: number;
    currentActiveShapes: number;
  } {
    const hasBlendShapeProxy = !!this.vrm?.expressionManager;
    const availableShapes = this.getAvailableBlendShapes();
    const activeShapes = Object.values(this.currentWeights).filter(
      (weight) => weight > 0
    );

    return {
      hasBlendShapeProxy,
      availableShapesCount: availableShapes.length,
      currentActiveShapes: activeShapes.length,
    };
  }
}

// シングルトンインスタンス
export const blendShapeService = new VRMBlendShapeService();
