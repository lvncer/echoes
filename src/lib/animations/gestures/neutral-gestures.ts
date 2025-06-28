import type { AnimationSequence } from "@/lib/types/animation";

/**
 * ニュートラル状態のジェスチャーアニメーション
 * 平常状態での自然な動作・癖・待機アニメーション
 */

// ラジャー（右手で額付近への敬礼）
export const salute: AnimationSequence = {
  name: "salute",
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
        // ラジャー開始 - 肩の準備
        Head: { rotation: [0.1, 0, 0] },
        RightShoulder: { rotation: [0.1, 0, 0] }, // 肩を少し上げ始める
        RightUpperArm: { rotation: [-0.2, 0.1, 0.1] }, // 上腕を準備位置に
        RightLowerArm: { rotation: [0, 0, 0.3] }, // 肘を少し曲げ始める
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // ラジャー時は口の変化なし
        A: 0,
        O: 0,
      },
    },
    {
      time: 2250,
      bones: {
        // ラジャー実行 - 手を額付近に持っていく
        Head: { rotation: [0.2, 0, 0] },
        RightShoulder: { rotation: [0.1, 0, 0] }, // 肩をもう少し上げる
        RightUpperArm: { rotation: [0.4, 0, 1.1] }, // 前に振り上げて敬礼位置に
        RightLowerArm: { rotation: [0.4, 1.3, 0.2] }, // 肘を曲げて額付近に
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // ラジャー時は口の変化なし
        A: 0,
        O: 0,
      },
    },
    {
      time: 5000,
      bones: {
        // 元の状態に戻る
        Head: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
        RightHand: { rotation: [0, 0, 0] },
      },
      blendShapes: {
        // 通常状態に戻る
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
export type NeutralGestureType = "salute" | "lightHeadShake" | "hairTouch";

// ニュートラルジェスチャーのマッピング
const neutralGestures = {
  salute,
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
    salute: "ラジャー（敬礼） - 右手で額付近への敬礼動作",
    lightHeadShake: "軽い首振り - 左右にゆっくりと首を振る",
    hairTouch: "髪をかき上げる - 手で前髪や髪の毛を整える",
  };
  return descriptions[gestureType] || "";
}
