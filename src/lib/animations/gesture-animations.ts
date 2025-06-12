import type { AnimationSequence } from "@/lib/types/animation";

/**
 * ジェスチャーアニメーション定義
 * 手、頭、体の動きによる表現力豊かなアニメーション
 */

// 手の動きアニメーション
export const handGestures = {
  // 指差し（右手）
  pointRight: {
    name: "pointRight",
    duration: 1500,
    loop: false,
    easing: "ease-out" as const,
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
  } as AnimationSequence,

  // 手振り（両手）
  wave: {
    name: "wave",
    duration: 2000,
    loop: false,
    easing: "ease-in-out" as const,
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
  } as AnimationSequence,

  // 拍手
  clap: {
    name: "clap",
    duration: 1200,
    loop: false,
    easing: "ease-in-out" as const,
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
  } as AnimationSequence,
};

// 頭の動きアニメーション
export const headGestures = {
  // うなずき
  nod: {
    name: "nod",
    duration: 1000,
    loop: false,
    easing: "ease-in-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 250,
        bones: {
          Head: { rotation: [0.3, 0, 0] },
          Neck: { rotation: [0.2, 0, 0] },
        },
      },
      {
        time: 500,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 750,
        bones: {
          Head: { rotation: [0.2, 0, 0] },
          Neck: { rotation: [0.1, 0, 0] },
        },
      },
      {
        time: 1000,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
    ],
  } as AnimationSequence,

  // 首振り
  shake: {
    name: "shake",
    duration: 1200,
    loop: false,
    easing: "ease-in-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 200,
        bones: {
          Head: { rotation: [0, -0.4, 0] },
          Neck: { rotation: [0, -0.2, 0] },
        },
      },
      {
        time: 400,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 600,
        bones: {
          Head: { rotation: [0, 0.4, 0] },
          Neck: { rotation: [0, 0.2, 0] },
        },
      },
      {
        time: 800,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 1000,
        bones: {
          Head: { rotation: [0, -0.2, 0] },
          Neck: { rotation: [0, -0.1, 0] },
        },
      },
      {
        time: 1200,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
    ],
  } as AnimationSequence,

  // 頭の傾き
  tilt: {
    name: "tilt",
    duration: 800,
    loop: false,
    easing: "ease-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          Head: { rotation: [0, 0, 0] },
          Neck: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 400,
        bones: {
          Head: { rotation: [0, 0, 0.3] },
          Neck: { rotation: [0, 0, 0.2] },
        },
      },
      {
        time: 800,
        bones: {
          Head: { rotation: [0, 0, 0.2] },
          Neck: { rotation: [0, 0, 0.1] },
        },
      },
    ],
  } as AnimationSequence,
};

// 体の動きアニメーション
export const bodyGestures = {
  // 前傾（興味・関心）
  leanForward: {
    name: "leanForward",
    duration: 1000,
    loop: false,
    easing: "ease-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          Spine: { rotation: [0, 0, 0] },
          UpperChest: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 600,
        bones: {
          Spine: { rotation: [0.2, 0, 0] },
          UpperChest: { rotation: [0.1, 0, 0] },
        },
      },
      {
        time: 1000,
        bones: {
          Spine: { rotation: [0.15, 0, 0] },
          UpperChest: { rotation: [0.08, 0, 0] },
        },
      },
    ],
  } as AnimationSequence,

  // 後退（驚き・警戒）
  leanBack: {
    name: "leanBack",
    duration: 800,
    loop: false,
    easing: "ease-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          Spine: { rotation: [0, 0, 0] },
          UpperChest: { rotation: [0, 0, 0] },
          Head: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 300,
        bones: {
          Spine: { rotation: [-0.2, 0, 0] },
          UpperChest: { rotation: [-0.15, 0, 0] },
          Head: { rotation: [-0.1, 0, 0] },
        },
      },
      {
        time: 800,
        bones: {
          Spine: { rotation: [-0.1, 0, 0] },
          UpperChest: { rotation: [-0.08, 0, 0] },
          Head: { rotation: [-0.05, 0, 0] },
        },
      },
    ],
  } as AnimationSequence,

  // 肩すくめ（困惑・無関心）
  shrug: {
    name: "shrug",
    duration: 1500,
    loop: false,
    easing: "ease-in-out" as const,
    keyframes: [
      {
        time: 0,
        bones: {
          LeftShoulder: { rotation: [0, 0, 0] },
          RightShoulder: { rotation: [0, 0, 0] },
          LeftUpperArm: { rotation: [0, 0, 0] },
          RightUpperArm: { rotation: [0, 0, 0] },
        },
      },
      {
        time: 500,
        bones: {
          LeftShoulder: { rotation: [0.3, 0, 0.2] },
          RightShoulder: { rotation: [0.3, 0, -0.2] },
          LeftUpperArm: { rotation: [0, 0, 0.3] },
          RightUpperArm: { rotation: [0, 0, -0.3] },
        },
      },
      {
        time: 1000,
        bones: {
          LeftShoulder: { rotation: [0.2, 0, 0.1] },
          RightShoulder: { rotation: [0.2, 0, -0.1] },
          LeftUpperArm: { rotation: [0, 0, 0.2] },
          RightUpperArm: { rotation: [0, 0, -0.2] },
        },
      },
      {
        time: 1500,
        bones: {
          LeftShoulder: { rotation: [0, 0, 0] },
          RightShoulder: { rotation: [0, 0, 0] },
          LeftUpperArm: { rotation: [0, 0, 0] },
          RightUpperArm: { rotation: [0, 0, 0] },
        },
      },
    ],
  } as AnimationSequence,
};

/**
 * ジェスチャータイプ定義
 */
export type GestureType =
  | "pointRight"
  | "wave"
  | "clap"
  | "nod"
  | "shake"
  | "tilt"
  | "leanForward"
  | "leanBack"
  | "shrug";

/**
 * ジェスチャーカテゴリ定義
 */
export type GestureCategory = "hand" | "head" | "body";

/**
 * 指定されたジェスチャーアニメーションを取得
 */
export function getGestureAnimation(
  gestureType: GestureType
): AnimationSequence | null {
  // 手のジェスチャー
  if (gestureType in handGestures) {
    return handGestures[gestureType as keyof typeof handGestures];
  }

  // 頭のジェスチャー
  if (gestureType in headGestures) {
    return headGestures[gestureType as keyof typeof headGestures];
  }

  // 体のジェスチャー
  if (gestureType in bodyGestures) {
    return bodyGestures[gestureType as keyof typeof bodyGestures];
  }

  console.warn(
    `🎭 GestureAnimations: 未知のジェスチャータイプ: ${gestureType}`
  );
  return null;
}

/**
 * カテゴリ別のジェスチャー一覧を取得
 */
export function getGesturesByCategory(
  category: GestureCategory
): GestureType[] {
  switch (category) {
    case "hand":
      return ["pointRight", "wave", "clap"];
    case "head":
      return ["nod", "shake", "tilt"];
    case "body":
      return ["leanForward", "leanBack", "shrug"];
    default:
      return [];
  }
}

/**
 * 利用可能な全ジェスチャーを取得
 */
export function getAllGestures(): GestureType[] {
  return [
    ...getGesturesByCategory("hand"),
    ...getGesturesByCategory("head"),
    ...getGesturesByCategory("body"),
  ];
}

/**
 * ジェスチャーの説明を取得
 */
export function getGestureDescription(gestureType: GestureType): string {
  const descriptions: Record<GestureType, string> = {
    pointRight: "右手で指差し",
    wave: "両手で手振り",
    clap: "拍手",
    nod: "うなずき",
    shake: "首振り",
    tilt: "頭の傾き",
    leanForward: "前傾（興味・関心）",
    leanBack: "後退（驚き・警戒）",
    shrug: "肩すくめ（困惑・無関心）",
  };

  return descriptions[gestureType] || "不明なジェスチャー";
}
