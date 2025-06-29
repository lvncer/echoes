// 新しい構造化されたアニメーション
export * from "./gestures";
export * from "./emotions";

// 後方互換性のために既存のファイルから選択的エクスポート（段階的移行用）
export {
  handGestures,
  headGestures,
  bodyGestures,
  getGestureAnimation as getLegacyGestureAnimation,
  getAllGestures as getAllLegacyGestures,
  getGestureDescription as getLegacyGestureDescription,
} from "./gesture-animations";

export {
  getEmotionAnimation as getLegacyEmotionAnimation,
  getAvailableEmotions,
} from "./emotion-animations";

import type { AnimationSequence, EmotionAnimation } from "@/lib/types/animation";

// 新しい構造からのインポート
import {
  type GestureType as NewGestureType,
  getGestureAnimation as getNewGestureAnimation,
  getAllGestures as getAllNewGestures,
  getGestureDescription as getNewGestureDescription,
  getGesturesByCategory,
  getGestureCategory,
  getGestureCategoryStats,
  getRandomGesture,
} from "./gestures";

import {
  type EmotionType as NewEmotionType,
  getEmotionAnimation as getNewEmotionAnimation,
  getAllEmotions as getAllNewEmotions,
  getEmotionsByCategory,
  getEmotionCategory,
  getRandomEmotion,
} from "./emotions";

// 既存の実装からのインポート（後方互換性用）
import {
  type GestureType as LegacyGestureType,
  getGestureAnimation as getGestureAnimationLegacy,
  getAllGestures as getAllGesturesLegacy,
  getGestureDescription as getGestureDescriptionLegacy,
} from "./gesture-animations";

import {
  getEmotionAnimation as getEmotionAnimationLegacy,
  getAvailableEmotions,
} from "./emotion-animations";

/**
 * 🎭 統合アニメーションシステム
 * 
 * このシステムは新しい構造化されたアニメーションと
 * 既存の実装の両方をサポートし、段階的な移行を可能にします。
 */

/**
 * 統合されたジェスチャー型（新旧両対応）
 */
export type GestureType = NewGestureType | LegacyGestureType;

/**
 * 統合されたアニメーション型
 */
export type AnimationType = GestureType | NewEmotionType;

/**
 * ジェスチャーアニメーションを取得（新旧自動判定）
 */
export function getGestureAnimation(gestureType: GestureType): AnimationSequence | null {
  // 新しい構造から取得を試行
  const newAnimation = getNewGestureAnimation(gestureType as NewGestureType);
  if (newAnimation) return newAnimation;

  // 既存の実装から取得（フォールバック）
  return getGestureAnimationLegacy(gestureType as LegacyGestureType);
}

/**
 * 感情アニメーションを取得（新旧自動判定）
 */
export function getEmotionAnimation(
  emotion: string,
  intensity: number = 1.0
): EmotionAnimation | null {
  // 新しい構造から取得を試行
  const newAnimation = getNewEmotionAnimation(emotion as NewEmotionType, intensity);
  if (newAnimation) return newAnimation;

  // 既存の実装から取得（フォールバック）
  return getEmotionAnimationLegacy(emotion, intensity);
}

/**
 * すべてのジェスチャーを取得（新旧統合）
 */
export function getAllGestures(): GestureType[] {
  const newGestures = getAllNewGestures();
  const legacyGestures = getAllGesturesLegacy();
  
  // 重複を除去して統合
  const allGestures = [...new Set([...newGestures, ...legacyGestures])];
  return allGestures as GestureType[];
}

/**
 * すべての感情を取得（新旧統合）
 */
export function getAllEmotions(): string[] {
  const newEmotions = getAllNewEmotions();
  const legacyEmotions = getAvailableEmotions();
  
  // 重複を除去して統合
  const allEmotions = [...new Set([...newEmotions, ...legacyEmotions])];
  return allEmotions;
}

/**
 * ジェスチャーの説明を取得（新旧自動判定）
 */
export function getGestureDescription(gestureType: GestureType): string {
  // 新しい構造から取得を試行
  const newDescription = getNewGestureDescription(gestureType as NewGestureType);
  if (newDescription) return newDescription;

  // 既存の実装から取得（フォールバック）
  return getGestureDescriptionLegacy(gestureType as LegacyGestureType);
}

/**
 * 🆕 新機能: カテゴリ別ジェスチャー取得
 */
export { getGesturesByCategory, getGestureCategory, getGestureCategoryStats };

/**
 * 🆕 新機能: カテゴリ別感情取得
 */
export { getEmotionsByCategory, getEmotionCategory };

/**
 * 🆕 新機能: ランダムアニメーション取得
 */
export { getRandomGesture, getRandomEmotion };

/**
 * 🔄 移行ヘルパー: 既存コードから新構造への移行支援
 */
export const AnimationMigration = {
  /**
   * 既存のジェスチャー名から新しい構造のものへのマッピング
   */
  mapLegacyGesture(legacyGesture: LegacyGestureType): NewGestureType | null {
    // 基本的にはそのまま移行可能
    const mapping: Partial<Record<LegacyGestureType, NewGestureType>> = {
      pointRight: "pointRight",
      wave: "wave",
      clap: "clap",
      nod: "nod",
      shake: "shake",
      tilt: "tilt",
      leanForward: "leanForward",
      leanBack: "leanBack",
      shrug: "shrug",
    };
    
    return mapping[legacyGesture] || null;
  },

  /**
   * 新しい構造で利用可能な機能をチェック
   */
  checkNewFeatures(): {
    neutralGestures: string[];
    categorization: boolean;
    randomSelection: boolean;
    totalGestures: number;
    totalEmotions: number;
  } {
    return {
      neutralGestures: getGesturesByCategory("neutral"),
      categorization: true,
      randomSelection: true,
      totalGestures: getAllNewGestures().length,
      totalEmotions: getAllNewEmotions().length,
    };
  }
};

/**
 * 📊 統計情報: アニメーションシステムの概要
 */
export function getAnimationSystemStats() {
  return {
    gestures: {
      total: getAllGestures().length,
      new: getAllNewGestures().length,
      legacy: getAllGesturesLegacy().length,
      categories: getGestureCategoryStats(),
    },
    emotions: {
      total: getAllEmotions().length,
      new: getAllNewEmotions().length,
      legacy: getAvailableEmotions().length,
    },
    features: {
      categorization: true,
      randomSelection: true,
      intensityControl: true,
      backwardCompatibility: true,
    },
  };
} 