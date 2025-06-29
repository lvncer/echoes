import type { AnimationSequence } from "@/lib/types/animation";

/**
 * 体のジェスチャーアニメーション
 * 体幹、姿勢の変化による表現
 */

// 前傾
export const leanForward: AnimationSequence = {
  name: "leanForward",
  duration: 1500,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Spine: {
          rotation: [0, 0, 0],
        },
        UpperChest: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 700,
      bones: {
        Spine: {
          rotation: [0.2, 0, 0], // 前に傾ける
        },
        UpperChest: {
          rotation: [0.1, 0, 0], // 上体も前に
        },
      },
    },
    {
      time: 1200,
      bones: {
        Spine: {
          rotation: [0.15, 0, 0], // 少し戻す
        },
        UpperChest: {
          rotation: [0.05, 0, 0],
        },
      },
    },
    {
      time: 1500,
      bones: {
        Spine: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
        UpperChest: {
          rotation: [0, 0, 0],
        },
      },
    },
  ],
};

// 後傾
export const leanBack: AnimationSequence = {
  name: "leanBack",
  duration: 1500,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Spine: {
          rotation: [0, 0, 0],
        },
        UpperChest: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 700,
      bones: {
        Spine: {
          rotation: [-0.15, 0, 0], // 後ろに傾ける
        },
        UpperChest: {
          rotation: [-0.1, 0, 0], // 上体も後ろに
        },
      },
    },
    {
      time: 1200,
      bones: {
        Spine: {
          rotation: [-0.1, 0, 0], // 少し戻す
        },
        UpperChest: {
          rotation: [-0.05, 0, 0],
        },
      },
    },
    {
      time: 1500,
      bones: {
        Spine: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
        UpperChest: {
          rotation: [0, 0, 0],
        },
      },
    },
  ],
};

// 肩をすくめる
export const shrug: AnimationSequence = {
  name: "shrug",
  duration: 1200,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        LeftShoulder: {
          rotation: [0, 0, 0],
        },
        RightShoulder: {
          rotation: [0, 0, 0],
        },
        LeftUpperArm: {
          rotation: [0, 0, 0],
        },
        RightUpperArm: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 400,
      bones: {
        LeftShoulder: {
          rotation: [0, 0, 0.3], // 左肩を上げる
        },
        RightShoulder: {
          rotation: [0, 0, -0.3], // 右肩を上げる
        },
        LeftUpperArm: {
          rotation: [0, 0, 0.2], // 腕も少し上げる
        },
        RightUpperArm: {
          rotation: [0, 0, -0.2],
        },
      },
    },
    {
      time: 800,
      bones: {
        LeftShoulder: {
          rotation: [0, 0, 0.25], // 少し下げる
        },
        RightShoulder: {
          rotation: [0, 0, -0.25],
        },
        LeftUpperArm: {
          rotation: [0, 0, 0.15],
        },
        RightUpperArm: {
          rotation: [0, 0, -0.15],
        },
      },
    },
    {
      time: 1200,
      bones: {
        LeftShoulder: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
        RightShoulder: {
          rotation: [0, 0, 0],
        },
        LeftUpperArm: {
          rotation: [0, 0, 0],
        },
        RightUpperArm: {
          rotation: [0, 0, 0],
        },
      },
    },
  ],
};

// 体のジェスチャー型定義
export type BodyGestureType = "leanForward" | "leanBack" | "shrug";

// 体のジェスチャーマッピング
const bodyGestures = {
  leanForward,
  leanBack,
  shrug,
} as const;

/**
 * 体のジェスチャーアニメーションを取得
 */
export function getBodyGestureAnimation(
  gestureType: BodyGestureType
): AnimationSequence | null {
  return bodyGestures[gestureType] || null;
}

/**
 * 利用可能な体のジェスチャー一覧を取得
 */
export function getAllBodyGestures(): BodyGestureType[] {
  return Object.keys(bodyGestures) as BodyGestureType[];
}

/**
 * 体のジェスチャーの説明を取得
 */
export function getBodyGestureDescription(gestureType: BodyGestureType): string {
  const descriptions = {
    leanForward: "前傾 - 体を前に傾けて興味や集中を示す",
    leanBack: "後傾 - 体を後ろに傾けてリラックスや距離感を示す",
    shrug: "肩すくめ - 両肩を上げて困惑や無関心を示す",
  };
  return descriptions[gestureType] || "";
} 