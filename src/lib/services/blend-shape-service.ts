import { VRM, VRMSchema } from "@pixiv/three-vrm";

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
    if (!this.vrm?.blendShapeProxy) {
      console.warn("VRM blendShapeProxy is not available");
      return;
    }

    try {
      // ウェイトを0-1の範囲にクランプ
      const clampedWeight = Math.max(0, Math.min(1, weight));

      // ブレンドシェイプを設定
      this.vrm.blendShapeProxy.setValue(name, clampedWeight);

      // 現在のウェイトを記録
      this.currentWeights[name] = clampedWeight;

      // 更新を適用
      this.vrm.blendShapeProxy.update();
    } catch (error) {
      console.warn(`Failed to set blend shape ${name}:`, error);
    }
  }

  /**
   * 利用可能なブレンドシェイプ名を取得
   */
  getAvailableBlendShapes(): string[] {
    if (!this.vrm?.blendShapeProxy) {
      return [];
    }

    try {
      // VRMSchemaの標準ブレンドシェイプ名を返す
      return Object.values(VRMSchema.BlendShapePresetName);
    } catch (error) {
      console.warn("Failed to get available blend shapes:", error);
      return [];
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
    if (!this.vrm?.blendShapeProxy) {
      return;
    }

    try {
      // 利用可能なブレンドシェイプをすべて0にリセット
      const availableShapes = this.getAvailableBlendShapes();
      availableShapes.forEach((shape) => {
        this.vrm!.blendShapeProxy!.setValue(shape, 0);
        this.currentWeights[shape] = 0;
      });

      this.vrm.blendShapeProxy.update();
    } catch (error) {
      console.warn("Failed to reset blend shapes:", error);
    }
  }

  /**
   * 複数のブレンドシェイプを一度に設定
   */
  setMultipleBlendShapes(weights: Record<string, number>): void {
    if (!this.vrm?.blendShapeProxy) {
      return;
    }

    try {
      Object.entries(weights).forEach(([name, weight]) => {
        const clampedWeight = Math.max(0, Math.min(1, weight));
        this.vrm!.blendShapeProxy!.setValue(name, clampedWeight);
        this.currentWeights[name] = clampedWeight;
      });

      this.vrm.blendShapeProxy.update();
    } catch (error) {
      console.warn("Failed to set multiple blend shapes:", error);
    }
  }

  /**
   * ブレンドシェイプが利用可能かチェック
   */
  isBlendShapeAvailable(name: string): boolean {
    if (!this.vrm?.blendShapeProxy) {
      return false;
    }

    try {
      // テスト用に一時的に設定してみる
      this.vrm.blendShapeProxy.setValue(name, 0);
      return true;
    } catch (error) {
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
    const hasBlendShapeProxy = !!this.vrm?.blendShapeProxy;
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
