// すべてのジェスチャーアニメーションをエクスポート
export * from "./neutral-gestures";
export * from "./hand-gestures";
export * from "./head-gestures";
export * from "./body-gestures";

import type { AnimationSequence } from "@/lib/types/animation";
import {
  type NeutralGestureType,
  getNeutralGestureAnimation,
  getAllNeutralGestures,
  getNeutralGestureDescription,
} from "./neutral-gestures";
import {
  type HandGestureType,
  getHandGestureAnimation,
  getAllHandGestures,
  getHandGestureDescription,
} from "./hand-gestures";
import {
  type HeadGestureType,
  getHeadGestureAnimation,
  getAllHeadGestures,
  getHeadGestureDescription,
} from "./head-gestures";
import {
  type BodyGestureType,
  getBodyGestureAnimation,
  getAllBodyGestures,
  getBodyGestureDescription,
} from "./body-gestures";

/**
 * 統合されたジェスチャー型
 */
export type GestureType = NeutralGestureType | HandGestureType | HeadGestureType | BodyGestureType;

/**
 * ジェスチャーカテゴリ
 */
export type GestureCategory = "neutral" | "hand" | "head" | "body";

/**
 * すべてのジェスチャーアニメーションを取得する統合関数
 */
export function getGestureAnimation(gestureType: GestureType): AnimationSequence | null {
  // ニュートラルジェスチャーをチェック
  const neutralAnimation = getNeutralGestureAnimation(gestureType as NeutralGestureType);
  if (neutralAnimation) return neutralAnimation;

  // 手のジェスチャーをチェック
  const handAnimation = getHandGestureAnimation(gestureType as HandGestureType);
  if (handAnimation) return handAnimation;

  // 頭のジェスチャーをチェック
  const headAnimation = getHeadGestureAnimation(gestureType as HeadGestureType);
  if (headAnimation) return headAnimation;

  // 体のジェスチャーをチェック
  const bodyAnimation = getBodyGestureAnimation(gestureType as BodyGestureType);
  if (bodyAnimation) return bodyAnimation;

  return null;
}

/**
 * カテゴリ別のジェスチャー一覧を取得
 */
export function getGesturesByCategory(category: GestureCategory): GestureType[] {
  switch (category) {
    case "neutral":
      return getAllNeutralGestures();
    case "hand":
      return getAllHandGestures();
    case "head":
      return getAllHeadGestures();
    case "body":
      return getAllBodyGestures();
    default:
      return [];
  }
}

/**
 * すべてのジェスチャー一覧を取得
 */
export function getAllGestures(): GestureType[] {
  return [
    ...getAllNeutralGestures(),
    ...getAllHandGestures(),
    ...getAllHeadGestures(),
    ...getAllBodyGestures(),
  ];
}

/**
 * ジェスチャーの説明を取得
 */
export function getGestureDescription(gestureType: GestureType): string {
  // ニュートラルジェスチャーをチェック
  const neutralDesc = getNeutralGestureDescription(gestureType as NeutralGestureType);
  if (neutralDesc) return neutralDesc;

  // 手のジェスチャーをチェック
  const handDesc = getHandGestureDescription(gestureType as HandGestureType);
  if (handDesc) return handDesc;

  // 頭のジェスチャーをチェック
  const headDesc = getHeadGestureDescription(gestureType as HeadGestureType);
  if (headDesc) return headDesc;

  // 体のジェスチャーをチェック
  const bodyDesc = getBodyGestureDescription(gestureType as BodyGestureType);
  if (bodyDesc) return bodyDesc;

  return "";
}

/**
 * ジェスチャーがどのカテゴリに属するかを判定
 */
export function getGestureCategory(gestureType: GestureType): GestureCategory | null {
  if (getAllNeutralGestures().includes(gestureType as NeutralGestureType)) {
    return "neutral";
  }
  if (getAllHandGestures().includes(gestureType as HandGestureType)) {
    return "hand";
  }
  if (getAllHeadGestures().includes(gestureType as HeadGestureType)) {
    return "head";
  }
  if (getAllBodyGestures().includes(gestureType as BodyGestureType)) {
    return "body";
  }
  return null;
}

/**
 * カテゴリ別のジェスチャー数を取得
 */
export function getGestureCategoryStats(): Record<GestureCategory, number> {
  return {
    neutral: getAllNeutralGestures().length,
    hand: getAllHandGestures().length,
    head: getAllHeadGestures().length,
    body: getAllBodyGestures().length,
  };
}

/**
 * ランダムなジェスチャーを取得（カテゴリ指定可）
 */
export function getRandomGesture(category?: GestureCategory): GestureType | null {
  const gestures = category ? getGesturesByCategory(category) : getAllGestures();
  if (gestures.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * gestures.length);
  return gestures[randomIndex];
}
