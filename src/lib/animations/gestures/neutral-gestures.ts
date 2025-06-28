import type { AnimationSequence } from "@/lib/types/animation";

/**
 * ニュートラル状態のジェスチャーアニメーション
 * 平常状態での自然な動作・癖・待機アニメーション
 */

// あくび（口を大きく開けて手で覆う）
export const yawn: AnimationSequence = {
  name: "yawn",
  duration: 6000,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        // 初期状態（ニュートラル）
        Head: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // 口の状態
        A: 0, // あ形
        O: 0, // お形
      },
    },
    {
      time: 1200,
      bones: {
        // あくび開始 - 頭を少し後ろに傾ける
        Head: { rotation: [0.15, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // 口を大きく開ける
        A: 0.4,
        O: 0.6,
      },
    },
    {
      time: 2250,
      bones: {
        // 最大あくび状態 - 手を口元に持っていく
        Head: { rotation: [0.2, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0.2] },
        RightUpperArm: { rotation: [0, 0.6, 0.8] },
        RightLowerArm: { rotation: [0, 0, 1.2] },
        RightHand: { rotation: [0.3, 0, 0.6] },
      },
      blendShapes: {
        // 口を最大に開ける
        A: 0.8,
        O: 0.8,
      },
    },
    {
      time: 3750,
      bones: {
        // あくび継続 - 手で口を覆う
        Head: { rotation: [0.15, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0.2] },
        RightUpperArm: { rotation: [0, 0.6, 0.8] },
        RightLowerArm: { rotation: [0, 0, 1.2] },
        RightHand: { rotation: [0.3, 0, 0.6] },
      },
      blendShapes: {
        // 口を少し閉じ始める
        A: 0.5,
        O: 0.5,
      },
    },
    {
      time: 5250,
      bones: {
        // あくび終了 - 手を下ろし始める
        Head: { rotation: [0.05, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0.1] },
        RightUpperArm: { rotation: [0, 0.3, 0.4] },
        RightLowerArm: { rotation: [0, 0, 0.6] },
        RightHand: { rotation: [0.1, 0, 0.1] },
      },
      blendShapes: {
        // 口を閉じていく
        A: 0.1,
        O: 0.1,
      },
    },
    {
      time: 6000,
      bones: {
        // 元の状態に戻る
        Head: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // 口を完全に閉じる
        A: 0,
        O: 0,
      },
    },
  ],
};

// 軽い首振り（左右にゆっくりと首を振る）
export const lightHeadShake: AnimationSequence = {
  name: "lightHeadShake",
  duration: 3000,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Head: { rotation: [0, 0, 0] },
      },
    },
    {
      time: 750,
      bones: {
        Head: { rotation: [0, 0.2, 0] },
      },
    },
    {
      time: 1500,
      bones: {
        Head: { rotation: [0, 0, 0] },
      },
    },
    {
      time: 2250,
      bones: {
        Head: { rotation: [0, -0.2, 0] },
      },
    },
    {
      time: 3000,
      bones: {
        Head: { rotation: [0, 0, 0] },
      },
    },
  ],
};

// 髪をかき上げる（手で前髪や髪の毛を整える）
export const hairTouch: AnimationSequence = {
  name: "hairTouch",
  duration: 2500,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
    },
    {
      time: 600,
      bones: {
        RightShoulder: { rotation: [0, 0, -0.2] },
        RightUpperArm: { rotation: [0, 0.8, -1.0] },
        RightLowerArm: { rotation: [0, 0, -0.8] },
        RightHand: { rotation: [0.2, 0, 0] },
      },
    },
    {
      time: 1200,
      bones: {
        RightShoulder: { rotation: [0, 0, -0.3] },
        RightUpperArm: { rotation: [0, 1.0, -1.2] },
        RightLowerArm: { rotation: [0, 0, -1.0] },
        RightHand: { rotation: [0.3, 0.2, 0] },
      },
    },
    {
      time: 1800,
      bones: {
        RightShoulder: { rotation: [0, 0, -0.2] },
        RightUpperArm: { rotation: [0, 0.8, -1.0] },
        RightLowerArm: { rotation: [0, 0, -0.8] },
        RightHand: { rotation: [0.2, 0, 0] },
      },
    },
    {
      time: 2500,
      bones: {
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
    },
  ],
};

// ニュートラルジェスチャーの型定義
export type NeutralGestureType = "yawn" | "lightHeadShake" | "hairTouch";

// ニュートラルジェスチャーのマッピング
const neutralGestures = {
  yawn,
  lightHeadShake,
  hairTouch,
} as const;

/**
 * ニュートラルジェスチャーアニメーションを取得
 */
export function getNeutralGestureAnimation(
  gestureType: NeutralGestureType
): AnimationSequence | null {
  return neutralGestures[gestureType] || null;
}

/**
 * 利用可能なニュートラルジェスチャー一覧を取得
 */
export function getAllNeutralGestures(): NeutralGestureType[] {
  return Object.keys(neutralGestures) as NeutralGestureType[];
}

/**
 * ニュートラルジェスチャーの説明を取得
 */
export function getNeutralGestureDescription(
  gestureType: NeutralGestureType
): string {
  const descriptions = {
    yawn: "あくび - 口を大きく開けて手で覆う自然な動作",
    lightHeadShake: "軽い首振り - 左右にゆっくりと首を振る",
    hairTouch: "髪をかき上げる - 手で前髪や髪の毛を整える",
  };
  return descriptions[gestureType] || "";
} 