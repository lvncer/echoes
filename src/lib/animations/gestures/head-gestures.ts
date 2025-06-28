import type { AnimationSequence } from "@/lib/types/animation";

/**
 * 頭のジェスチャーアニメーション
 * 頭の動きによる表現・うなずき・首振り等
 */

// うなずき
export const nod: AnimationSequence = {
  name: "nod",
  duration: 1000,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Head: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 300,
      bones: {
        Head: {
          rotation: [0.3, 0, 0], // 下に向ける
        },
      },
    },
    {
      time: 600,
      bones: {
        Head: {
          rotation: [-0.1, 0, 0], // 少し上に戻す
        },
      },
    },
    {
      time: 1000,
      bones: {
        Head: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
      },
    },
  ],
};

// 首を振る（否定）
export const shake: AnimationSequence = {
  name: "shake",
  duration: 1200,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Head: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 200,
      bones: {
        Head: {
          rotation: [0, 0.3, 0], // 右に向ける
        },
      },
    },
    {
      time: 400,
      bones: {
        Head: {
          rotation: [0, -0.3, 0], // 左に向ける
        },
      },
    },
    {
      time: 600,
      bones: {
        Head: {
          rotation: [0, 0.2, 0], // 右に向ける（小さく）
        },
      },
    },
    {
      time: 800,
      bones: {
        Head: {
          rotation: [0, -0.2, 0], // 左に向ける（小さく）
        },
      },
    },
    {
      time: 1200,
      bones: {
        Head: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
      },
    },
  ],
};

// 首をかしげる
export const tilt: AnimationSequence = {
  name: "tilt",
  duration: 1500,
  loop: false,
  easing: "ease-in-out",
  keyframes: [
    {
      time: 0,
      bones: {
        Head: {
          rotation: [0, 0, 0],
        },
      },
    },
    {
      time: 500,
      bones: {
        Head: {
          rotation: [0, 0, 0.3], // 右に傾ける
        },
      },
    },
    {
      time: 1000,
      bones: {
        Head: {
          rotation: [0, 0, 0.2], // 少し戻す
        },
      },
    },
    {
      time: 1500,
      bones: {
        Head: {
          rotation: [0, 0, 0], // 元の位置に戻す
        },
      },
    },
  ],
};

// 頭のジェスチャー型定義
export type HeadGestureType = "nod" | "shake" | "tilt";

// 頭のジェスチャーマッピング
const headGestures = {
  nod,
  shake,
  tilt,
} as const;

/**
 * 頭のジェスチャーアニメーションを取得
 */
export function getHeadGestureAnimation(
  gestureType: HeadGestureType
): AnimationSequence | null {
  return headGestures[gestureType] || null;
}

/**
 * 利用可能な頭のジェスチャー一覧を取得
 */
export function getAllHeadGestures(): HeadGestureType[] {
  return Object.keys(headGestures) as HeadGestureType[];
}

/**
 * 頭のジェスチャーの説明を取得
 */
export function getHeadGestureDescription(gestureType: HeadGestureType): string {
  const descriptions = {
    nod: "うなずき - 頭を上下に動かして同意を示す",
    shake: "首振り - 頭を左右に振って否定を示す",
    tilt: "首かしげ - 頭を傾けて疑問や興味を示す",
  };
  return descriptions[gestureType] || "";
} 