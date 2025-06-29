import type { AnimationSequence } from "@/lib/types/animation";

/**
 * 手のジェスチャーアニメーション
 * 手、腕の動きによる表現豊かなアニメーション
 */

// 指差し（右手）
export const pointRight: AnimationSequence = {
  name: "pointRight",
  duration: 1500,
  loop: false,
  easing: "ease-out",
  keyframes: [
    {
      time: 0,
      bones: {
        RightShoulder: {
          rotation: [0, 0, 0],
        },
        RightUpperArm: {
          rotation: [0, 0, 0],
        },
        RightLowerArm: {
          rotation: [0, 0, 0],
        },
        RightHand: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 800,
      bones: {
        RightShoulder: {
          rotation: [0, 0, -0.3],
        },
        RightUpperArm: {
          rotation: [0, 0.8, -0.5],
        },
        RightLowerArm: {
          rotation: [0, 0, -0.8],
        },
        RightHand: {
          rotation: [0, 0, 0.2],
        },
      },
    },
    {
      time: 1500,
      bones: {
        RightShoulder: {
          rotation: [0, 0, 0],
        },
        RightUpperArm: {
          rotation: [0, 0, 0],
        },
        RightLowerArm: {
          rotation: [0, 0, 0],
        },
        RightHand: {
          rotation: [0, 0, 0],
        },
      },
    },
  ],
};

// 手振り（両手）
export const wave: AnimationSequence = {
  name: "wave",
  duration: 2000,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0] },
        LeftUpperArm: { rotation: [0, 0, 0] },
        LeftLowerArm: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
      },
    },
    {
      time: 500,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.4] },
        LeftUpperArm: { rotation: [0, -0.6, 0.8] },
        LeftLowerArm: { rotation: [0, 0, 0.6] },
        RightShoulder: { rotation: [0, 0, -0.4] },
        RightUpperArm: { rotation: [0, 0.6, -0.8] },
        RightLowerArm: { rotation: [0, 0, -0.6] },
      },
    },
    {
      time: 1000,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.2] },
        LeftUpperArm: { rotation: [0, -0.3, 0.4] },
        LeftLowerArm: { rotation: [0, 0, 0.3] },
        RightShoulder: { rotation: [0, 0, -0.2] },
        RightUpperArm: { rotation: [0, 0.3, -0.4] },
        RightLowerArm: { rotation: [0, 0, -0.3] },
      },
    },
    {
      time: 1500,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.4] },
        LeftUpperArm: { rotation: [0, -0.6, 0.8] },
        LeftLowerArm: { rotation: [0, 0, 0.6] },
        RightShoulder: { rotation: [0, 0, -0.4] },
        RightUpperArm: { rotation: [0, 0.6, -0.8] },
        RightLowerArm: { rotation: [0, 0, -0.6] },
      },
    },
    {
      time: 2000,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0] },
        LeftUpperArm: { rotation: [0, 0, 0] },
        LeftLowerArm: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
      },
    },
  ],
};

// 拍手
export const clap: AnimationSequence = {
  name: "clap",
  duration: 1200,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0] },
        LeftUpperArm: { rotation: [0, 0, 0] },
        LeftLowerArm: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
      },
    },
    {
      time: 200,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.3] },
        LeftUpperArm: { rotation: [0, -0.8, 0.6] },
        LeftLowerArm: { rotation: [0, 0, 0.8] },
        RightShoulder: { rotation: [0, 0, -0.3] },
        RightUpperArm: { rotation: [0, 0.8, -0.6] },
        RightLowerArm: { rotation: [0, 0, -0.8] },
      },
    },
    {
      time: 400,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.2] },
        LeftUpperArm: { rotation: [0, -0.6, 0.4] },
        LeftLowerArm: { rotation: [0, 0, 0.6] },
        RightShoulder: { rotation: [0, 0, -0.2] },
        RightUpperArm: { rotation: [0, 0.6, -0.4] },
        RightLowerArm: { rotation: [0, 0, -0.6] },
      },
    },
    {
      time: 600,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.3] },
        LeftUpperArm: { rotation: [0, -0.8, 0.6] },
        LeftLowerArm: { rotation: [0, 0, 0.8] },
        RightShoulder: { rotation: [0, 0, -0.3] },
        RightUpperArm: { rotation: [0, 0.8, -0.6] },
        RightLowerArm: { rotation: [0, 0, -0.8] },
      },
    },
    {
      time: 800,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0.2] },
        LeftUpperArm: { rotation: [0, -0.6, 0.4] },
        LeftLowerArm: { rotation: [0, 0, 0.6] },
        RightShoulder: { rotation: [0, 0, -0.2] },
        RightUpperArm: { rotation: [0, 0.6, -0.4] },
        RightLowerArm: { rotation: [0, 0, -0.6] },
      },
    },
    {
      time: 1200,
      bones: {
        LeftShoulder: { rotation: [0, 0, 0] },
        LeftUpperArm: { rotation: [0, 0, 0] },
        LeftLowerArm: { rotation: [0, 0, 0] },
        RightShoulder: { rotation: [0, 0, 0] },
        RightUpperArm: { rotation: [0, 0, 0] },
        RightLowerArm: { rotation: [0, 0, 0] },
      },
    },
  ],
};

// 手のジェスチャー型定義
export type HandGestureType = "pointRight" | "wave" | "clap";

// 手のジェスチャーマッピング
const handGestures = {
  pointRight,
  wave,
  clap,
} as const;

/**
 * 手のジェスチャーアニメーションを取得
 */
export function getHandGestureAnimation(
  gestureType: HandGestureType
): AnimationSequence | null {
  return handGestures[gestureType] || null;
}

/**
 * 利用可能な手のジェスチャー一覧を取得
 */
export function getAllHandGestures(): HandGestureType[] {
  return Object.keys(handGestures) as HandGestureType[];
}

/**
 * 手のジェスチャーの説明を取得
 */
export function getHandGestureDescription(gestureType: HandGestureType): string {
  const descriptions = {
    pointRight: "指差し（右手） - 右手で対象を指し示す",
    wave: "手振り（両手） - 両手を上げて左右に振る挨拶動作",
    clap: "拍手 - 両手を合わせて叩く喜びの表現",
  };
  return descriptions[gestureType] || "";
} 