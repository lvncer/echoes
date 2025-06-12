import { VRM } from "@pixiv/three-vrm";

/**
 * VRMブレンドシェイプ制御サービス
 * VRMモデルの表情・口の形を制御する
 */
export class VRMBlendShapeService {
  private vrm: VRM | null = null;
  private currentWeights: Record<string, number> = {};
  private hasLoggedAvailableShapes = false;

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

      // ニコニ立体ちゃん対応: 標準名からモデル固有名にマッピング
      const actualName = this.mapBlendShapeName(name);

      // ブレンドシェイプを設定
      this.vrm.expressionManager.setValue(actualName, clampedWeight);

      // 現在のウェイトを記録（標準名で記録）
      this.currentWeights[name] = clampedWeight;

      // 更新を適用（複数回実行して確実に反映）
      this.vrm.expressionManager.update();

      // 設定後の値を確認
      const actualValue = this.vrm.expressionManager.getValue(actualName) || 0;

      // デバッグログ（設定値と実際の値を比較）
      if (actualName !== name) {
        console.log(
          `ブレンドシェイプマッピング: ${name} → ${actualName} = ${clampedWeight} (実際: ${actualValue})`
        );
      } else {
        console.log(
          `ブレンドシェイプ設定: ${name} = ${clampedWeight} (実際: ${actualValue})`
        );
      }

      // 値が正しく設定されていない場合は警告
      if (Math.abs(actualValue - clampedWeight) > 0.01) {
        console.warn(
          `⚠️ ブレンドシェイプ値の不一致: ${actualName} 設定=${clampedWeight}, 実際=${actualValue}`
        );
      }
    } catch (error) {
      console.warn(`Failed to set blend shape ${name}:`, error);
    }
  }

  /**
   * 標準ブレンドシェイプ名をモデル固有名にマッピング
   */
  private mapBlendShapeName(standardName: string): string {
    if (!this.vrm?.expressionManager) {
      return standardName;
    }

    // 利用可能なブレンドシェイプ名を取得
    const availableShapes = this.getAvailableBlendShapes();

    // 既に存在する場合はそのまま返す
    if (availableShapes.includes(standardName)) {
      return standardName;
    }

    // ニコニ立体ちゃん対応マッピング
    const mappings: Record<string, string[]> = {
      A: ["あ", "mouth_a", "Mouth_A", "vrc.v_aa", "aa"],
      I: ["い", "mouth_i", "Mouth_I", "vrc.v_ih", "ih"],
      U: ["う", "mouth_u", "Mouth_U", "vrc.v_ou", "ou"],
      E: ["え", "mouth_e", "Mouth_E", "vrc.v_ee", "ee"],
      O: ["お", "mouth_o", "Mouth_O", "vrc.v_oh", "oh"],

      aa: ["A", "あ", "mouth_a", "Mouth_A", "vrc.v_aa"],
      ih: ["I", "い", "mouth_i", "Mouth_I", "vrc.v_ih"],
      ou: ["U", "う", "mouth_u", "Mouth_U", "vrc.v_ou"],
      ee: ["E", "え", "mouth_e", "Mouth_E", "vrc.v_ee"],
      oh: ["O", "お", "mouth_o", "Mouth_O", "vrc.v_oh"],

      Joy: ["喜び", "happy", "Happy"],
      Angry: ["怒り", "angry", "Angry"],
      Sorrow: ["悲しみ", "sad", "Sad"],
      Fun: ["楽しい", "surprised", "Surprised"],
      Blink: ["まばたき", "blink"],
      BlinkL: ["左まばたき", "blinkLeft"],
      BlinkR: ["右まばたき", "blinkRight"],
    };

    // マッピングを試行
    const alternatives = mappings[standardName];
    if (alternatives) {
      for (const alt of alternatives) {
        if (availableShapes.includes(alt)) {
          return alt;
        }
      }
    }

    // マッピングが見つからない場合は元の名前を返す
    return standardName;
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
          // 標準的なVRM形式
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

          // ニコニ立体ちゃん対応（ひらがな）
          "あ",
          "い",
          "う",
          "え",
          "お",

          // その他の一般的な形式
          "mouth_a",
          "mouth_i",
          "mouth_u",
          "mouth_e",
          "mouth_o",
          "Mouth_A",
          "Mouth_I",
          "Mouth_U",
          "Mouth_E",
          "Mouth_O",
          "vrc.v_aa",
          "vrc.v_ih",
          "vrc.v_ou",
          "vrc.v_ee",
          "vrc.v_oh",

          // 感情表現
          "Joy",
          "Angry",
          "Sorrow",
          "Fun",
          "happy",
          "angry",
          "sad",
          "surprised", // 英語名
          "喜び",
          "怒り",
          "悲しみ",
          "楽しい", // 日本語名

          // まばたき
          "Blink",
          "BlinkL",
          "BlinkR",
          "blink",
          "blinkLeft",
          "blinkRight", // 英語名
          "まばたき",
          "左まばたき",
          "右まばたき", // 日本語名

          // 視線
          "LookUp",
          "LookDown",
          "LookLeft",
          "LookRight",
          "lookUp",
          "lookDown",
          "lookLeft",
          "lookRight", // 英語名
          "上",
          "下",
          "左",
          "右", // 日本語名
        ];

        // 実際に設定可能かテストして追加
        for (const shape of standardShapes) {
          if (this.testBlendShapeAvailability(shape)) {
            availableShapes.push(shape);
          }
        }
      }

      // デバッグログは初回のみ出力
      if (availableShapes.length > 0 && !this.hasLoggedAvailableShapes) {
        console.log("利用可能なブレンドシェイプ:", availableShapes);
        this.hasLoggedAvailableShapes = true;
      }
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
    hasVRM: boolean;
    hasBlendShapeProxy: boolean;
    availableBlendShapes: string[];
    availableShapesCount: number;
    currentActiveShapes: number;
    currentWeights: Record<string, number>;
  } {
    const hasVRM = !!this.vrm;
    const hasBlendShapeProxy = !!this.vrm?.expressionManager;
    const availableBlendShapes = this.getAvailableBlendShapes();
    const activeShapes = Object.values(this.currentWeights).filter(
      (weight) => weight > 0
    );

    return {
      hasVRM,
      hasBlendShapeProxy,
      availableBlendShapes,
      availableShapesCount: availableBlendShapes.length,
      currentActiveShapes: activeShapes.length,
      currentWeights: { ...this.currentWeights },
    };
  }

  /**
   * ブレンドシェイプのテスト実行
   */
  async testBlendShapes(): Promise<{
    success: boolean;
    results: Array<{
      name: string;
      available: boolean;
      testValue: number;
      error?: string;
    }>;
  }> {
    const results: Array<{
      name: string;
      available: boolean;
      testValue: number;
      error?: string;
    }> = [];

    if (!this.vrm?.expressionManager) {
      return {
        success: false,
        results: [
          {
            name: "system",
            available: false,
            testValue: 0,
            error: "VRMモデルまたはExpressionManagerが利用できません",
          },
        ],
      };
    }

    // 基本的な口の形のブレンドシェイプをテスト
    const testShapes = ["A", "I", "U", "E", "O", "aa", "ih", "ou", "ee", "oh"];

    for (const shapeName of testShapes) {
      try {
        // マッピングされた実際の名前を取得
        const actualName = this.mapBlendShapeName(shapeName);

        // 現在の値を保存
        const originalValue =
          this.vrm.expressionManager.getValue(actualName) || 0;

        // テスト値を設定
        const testValue = 0.5;
        this.vrm.expressionManager.setValue(actualName, testValue);
        this.vrm.expressionManager.update();

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 設定された値を確認
        const actualValue =
          this.vrm.expressionManager.getValue(actualName) || 0;
        const isAvailable = Math.abs(actualValue - testValue) < 0.1;

        results.push({
          name: `${shapeName}${
            actualName !== shapeName ? ` → ${actualName}` : ""
          }`,
          available: isAvailable,
          testValue: actualValue,
        });

        // 元の値に戻す
        this.vrm.expressionManager.setValue(actualName, originalValue);
        this.vrm.expressionManager.update();

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        results.push({
          name: shapeName,
          available: false,
          testValue: 0,
          error: error instanceof Error ? error.message : "不明なエラー",
        });
      }
    }

    const successCount = results.filter((r) => r.available).length;
    const success = successCount > 0;

    console.log(
      `ブレンドシェイプテスト完了: ${successCount}/${results.length} 成功`
    );
    console.table(results);

    return {
      success,
      results,
    };
  }

  /**
   * デモンストレーション用のアニメーション実行
   */
  async runDemoAnimation(): Promise<void> {
    if (!this.vrm?.expressionManager) {
      console.warn("VRMモデルが利用できません");
      return;
    }

    console.log("デモアニメーション開始...");

    const shapes = ["A", "I", "U", "E", "O"];
    const duration = 1000; // 1秒

    for (const shape of shapes) {
      if (this.isBlendShapeAvailable(shape)) {
        // フェードイン
        for (let i = 0; i <= 10; i++) {
          const weight = i / 10;
          this.setBlendShapeWeight(shape, weight);
          await new Promise((resolve) => setTimeout(resolve, duration / 20));
        }

        // 少し保持
        await new Promise((resolve) => setTimeout(resolve, duration / 4));

        // フェードアウト
        for (let i = 10; i >= 0; i--) {
          const weight = i / 10;
          this.setBlendShapeWeight(shape, weight);
          await new Promise((resolve) => setTimeout(resolve, duration / 20));
        }

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, duration / 4));
      }
    }

    console.log("デモアニメーション完了");
  }
}

// シングルトンインスタンス
export const blendShapeService = new VRMBlendShapeService();
