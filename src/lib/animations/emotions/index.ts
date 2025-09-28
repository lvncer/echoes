// すべての感情アニメーションをエクスポート
export * from "./basic-emotions";

import type { EmotionAnimation } from "@/types/animation";
import {
  type BasicEmotionType,
  getBasicEmotionAnimation,
  getAllBasicEmotions,
  getBasicEmotionDescription,
} from "./basic-emotions";

/**
 * 統合された感情型（将来的に拡張可能）
 */
export type EmotionType = BasicEmotionType;

/**
 * 感情カテゴリ
 */
export type EmotionCategory = "basic";

/**
 * すべての感情アニメーションを取得する統合関数
 */
export function getEmotionAnimation(
  emotion: EmotionType,
  intensity: number = 1.0,
): EmotionAnimation | null {
  // 基本感情をチェック
  return getBasicEmotionAnimation(emotion as BasicEmotionType, intensity);
}

/**
 * カテゴリ別の感情一覧を取得
 */
export function getEmotionsByCategory(category: EmotionCategory): EmotionType[] {
  switch (category) {
    case "basic":
      return getAllBasicEmotions();
    default:
      return [];
  }
}

/**
 * すべての感情一覧を取得
 */
export function getAllEmotions(): EmotionType[] {
  return getAllBasicEmotions();
}

/**
 * 感情の説明を取得
 */
export function getEmotionDescription(emotion: EmotionType): string {
  return getBasicEmotionDescription(emotion as BasicEmotionType);
}

/**
 * 感情がどのカテゴリに属するかを判定
 */
export function getEmotionCategory(emotion: EmotionType): EmotionCategory | null {
  if (getAllBasicEmotions().includes(emotion as BasicEmotionType)) {
    return "basic";
  }
  return null;
}

/**
 * カテゴリ別の感情数を取得
 */
export function getEmotionCategoryStats(): Record<EmotionCategory, number> {
  return {
    basic: getAllBasicEmotions().length,
  };
}

/**
 * ランダムな感情を取得（カテゴリ指定可）
 */
export function getRandomEmotion(category?: EmotionCategory): EmotionType | null {
  const emotions = category ? getEmotionsByCategory(category) : getAllEmotions();
  if (emotions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emotions.length);
  return emotions[randomIndex];
}
