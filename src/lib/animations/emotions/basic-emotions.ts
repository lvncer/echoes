import type {
  EmotionAnimation,
  AnimationSequence,
} from "@/lib/types/animation";

/**
 * 基本感情アニメーション定義
 * VRMブレンドシェイプとボーン制御を組み合わせた基本的な感情表現
 */

// ニュートラル（デフォルト状態）
const neutralAnimation: EmotionAnimation = {
  emotion: "neutral",
  intensity: 1.0,
  animations: {
    facial: {
      name: "neutral_facial",
      duration: 1000,
      loop: false,
      easing: "ease-in-out",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            neutral: 0,
            joy: 0,
            sorrow: 0,
            anger: 0,
            surprise: 0,
            fun: 0,
            smile: 0,
            frown: 0,
            mad: 0,
            shocked: 0,
          },
        },
        {
          time: 1000,
          blendShapes: {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            neutral: 0,
            joy: 0,
            sorrow: 0,
            anger: 0,
            surprise: 0,
            fun: 0,
            smile: 0,
            frown: 0,
            mad: 0,
            shocked: 0,
          },
        },
      ],
    },
    gesture: {
      name: "neutral_gesture",
      duration: 2000,
      loop: false,
      easing: "ease-in-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
          },
        },
        {
          time: 2000,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
          },
        },
      ],
    },
  },
};

// 喜び（微笑み、軽いうなずき）
const happyAnimation: EmotionAnimation = {
  emotion: "happy",
  intensity: 1.0,
  animations: {
    facial: {
      name: "happy_facial",
      duration: 1500,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            happy: 0,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 300,
          blendShapes: {
            happy: 0.7,
            blinkLeft: 0.3,
            blinkRight: 0.3,
          },
        },
        {
          time: 800,
          blendShapes: {
            happy: 0.8,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 1500,
          blendShapes: {
            happy: 0.6,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
      ],
    },
    gesture: {
      name: "happy_gesture",
      duration: 2000,
      loop: false,
      easing: "ease-in-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
          },
        },
        {
          time: 500,
          bones: {
            Head: { rotation: [0.1, 0, 0] }, // 軽いうなずき
            LeftShoulder: { rotation: [0, 0, -0.05] }, // 肩を少し上げる
            RightShoulder: { rotation: [0, 0, 0.05] },
          },
        },
        {
          time: 1000,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, -0.02] },
            RightShoulder: { rotation: [0, 0, 0.02] },
          },
        },
        {
          time: 2000,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
          },
        },
      ],
    },
  },
};

// 悲しみ（うつむき、肩を落とす）
const sadAnimation: EmotionAnimation = {
  emotion: "sad",
  intensity: 1.0,
  animations: {
    facial: {
      name: "sad_facial",
      duration: 2000,
      loop: false,
      easing: "ease-in",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            sad: 0,
            sorrow: 0,
            frown: 0,
          },
        },
        {
          time: 800,
          blendShapes: {
            sad: 0.6,
            sorrow: 0.4,
            frown: 0.3,
          },
        },
        {
          time: 2000,
          blendShapes: {
            sad: 0.8,
            sorrow: 0.6,
            frown: 0.4,
          },
        },
      ],
    },
    gesture: {
      name: "sad_gesture",
      duration: 2500,
      loop: false,
      easing: "ease-in",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
          },
        },
        {
          time: 1000,
          bones: {
            Head: { rotation: [0.2, 0, 0] }, // うつむく
            LeftShoulder: { rotation: [0.1, 0, 0.1] }, // 肩を落とす
            RightShoulder: { rotation: [0.1, 0, -0.1] },
            Spine: { rotation: [0.05, 0, 0] },
          },
        },
        {
          time: 2500,
          bones: {
            Head: { rotation: [0.3, 0, 0] },
            LeftShoulder: { rotation: [0.15, 0, 0.15] },
            RightShoulder: { rotation: [0.15, 0, -0.15] },
            Spine: { rotation: [0.1, 0, 0] },
          },
        },
      ],
    },
  },
};

// 怒り（眉をひそめる、胸を張る）
const angryAnimation: EmotionAnimation = {
  emotion: "angry",
  intensity: 1.0,
  animations: {
    facial: {
      name: "angry_facial",
      duration: 1200,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            angry: 0,
            anger: 0,
            mad: 0,
            frown: 0,
          },
        },
        {
          time: 400,
          blendShapes: {
            angry: 0.8,
            anger: 0.6,
            mad: 0.4,
            frown: 0.7,
          },
        },
        {
          time: 1200,
          blendShapes: {
            angry: 0.9,
            anger: 0.8,
            mad: 0.6,
            frown: 0.8,
          },
        },
      ],
    },
    gesture: {
      name: "angry_gesture",
      duration: 1500,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
            UpperChest: { rotation: [0, 0, 0] },
          },
        },
        {
          time: 600,
          bones: {
            Head: { rotation: [-0.1, 0, 0] }, // 顔を上げる
            LeftShoulder: { rotation: [0, 0, -0.2] }, // 胸を張る
            RightShoulder: { rotation: [0, 0, 0.2] },
            Spine: { rotation: [-0.05, 0, 0] },
            UpperChest: { rotation: [-0.1, 0, 0] },
          },
        },
        {
          time: 1500,
          bones: {
            Head: { rotation: [-0.05, 0, 0] },
            LeftShoulder: { rotation: [0, 0, -0.15] },
            RightShoulder: { rotation: [0, 0, 0.15] },
            Spine: { rotation: [-0.03, 0, 0] },
            UpperChest: { rotation: [-0.08, 0, 0] },
          },
        },
      ],
    },
  },
};

// 驚き（目を見開く、後ずさり）
const surprisedAnimation: EmotionAnimation = {
  emotion: "surprised",
  intensity: 1.0,
  animations: {
    facial: {
      name: "surprised_facial",
      duration: 800,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            surprised: 0,
            surprise: 0,
            shocked: 0,
          },
        },
        {
          time: 200,
          blendShapes: {
            surprised: 0.9,
            surprise: 0.8,
            shocked: 0.7,
          },
        },
        {
          time: 800,
          blendShapes: {
            surprised: 0.7,
            surprise: 0.6,
            shocked: 0.5,
          },
        },
      ],
    },
    gesture: {
      name: "surprised_gesture",
      duration: 1000,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
          },
        },
        {
          time: 300,
          bones: {
            Head: { rotation: [-0.1, 0, 0] }, // 頭を少し後ろに
            LeftShoulder: { rotation: [0, 0, 0.1] }, // 肩を上げる
            RightShoulder: { rotation: [0, 0, -0.1] },
            Spine: { rotation: [-0.05, 0, 0] }, // 後ずさり
          },
        },
        {
          time: 1000,
          bones: {
            Head: { rotation: [0, 0, 0] },
            LeftShoulder: { rotation: [0, 0, 0] },
            RightShoulder: { rotation: [0, 0, 0] },
            Spine: { rotation: [0, 0, 0] },
          },
        },
      ],
    },
  },
};

// 基本感情のマッピング
const basicEmotions = {
  neutral: neutralAnimation,
  happy: happyAnimation,
  sad: sadAnimation,
  angry: angryAnimation,
  surprised: surprisedAnimation,
} as const;

/**
 * 基本感情型定義
 */
export type BasicEmotionType = keyof typeof basicEmotions;

/**
 * 基本感情アニメーションを取得
 */
export function getBasicEmotionAnimation(
  emotion: BasicEmotionType,
  intensity: number = 1.0
): EmotionAnimation | null {
  const animation = basicEmotions[emotion];
  if (!animation) return null;

  return adjustAnimationIntensity(animation, intensity);
}

/**
 * 利用可能な基本感情一覧を取得
 */
export function getAllBasicEmotions(): BasicEmotionType[] {
  return Object.keys(basicEmotions) as BasicEmotionType[];
}

/**
 * 基本感情の説明を取得
 */
export function getBasicEmotionDescription(emotion: BasicEmotionType): string {
  const descriptions = {
    neutral: "ニュートラル - 平常状態、感情のない自然な表情",
    happy: "喜び - 微笑みと軽いうなずきで喜びを表現",
    sad: "悲しみ - うつむきと肩を落として悲しみを表現",
    angry: "怒り - 眉をひそめて胸を張り怒りを表現",
    surprised: "驚き - 目を見開いて後ずさりで驚きを表現",
  };
  return descriptions[emotion] || "";
}

/**
 * アニメーション強度を調整
 */
function adjustAnimationIntensity(
  animation: EmotionAnimation,
  intensity: number
): EmotionAnimation {
  const adjustedAnimation: EmotionAnimation = {
    ...animation,
    intensity,
    animations: {
      facial: adjustSequenceIntensity(animation.animations.facial, intensity),
      gesture: adjustSequenceIntensity(animation.animations.gesture, intensity),
    },
  };

  return adjustedAnimation;
}

/**
 * アニメーションシーケンスの強度を調整
 */
function adjustSequenceIntensity(
  sequence: AnimationSequence,
  intensity: number
): AnimationSequence {
  return {
    ...sequence,
    keyframes: sequence.keyframes.map((keyframe) => ({
      ...keyframe,
      blendShapes: keyframe.blendShapes
        ? Object.fromEntries(
            Object.entries(keyframe.blendShapes).map(([key, value]) => [
              key,
              value * intensity,
            ])
          )
        : undefined,
      bones: keyframe.bones
        ? Object.fromEntries(
            Object.entries(keyframe.bones).map(([boneName, transform]) => [
              boneName,
              {
                ...transform,
                rotation: transform.rotation
                  ? (transform.rotation.map((r) => r * intensity) as [number, number, number])
                  : undefined,
              },
            ])
          )
        : undefined,
    })),
  };
} 