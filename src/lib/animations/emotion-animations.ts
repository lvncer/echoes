import type {
  EmotionAnimation,
  AnimationSequence,
} from "@/lib/types/animation";

/**
 * 感情アニメーション定義
 * VRMブレンドシェイプとボーン制御を組み合わせた5種類の感情表現
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
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
            Spine: {
              rotation: [0, 0, 0],
            },
          },
        },
        {
          time: 2000,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
            Spine: {
              rotation: [0, 0, 0],
            },
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
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
          },
        },
        {
          time: 500,
          bones: {
            Head: {
              rotation: [0.1, 0, 0], // 軽いうなずき
            },
            LeftShoulder: {
              rotation: [0, 0, -0.05], // 肩を少し上げる
            },
            RightShoulder: {
              rotation: [0, 0, 0.05],
            },
          },
        },
        {
          time: 1000,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, -0.02],
            },
            RightShoulder: {
              rotation: [0, 0, 0.02],
            },
          },
        },
        {
          time: 2000,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
          },
        },
      ],
    },
  },
};

// 悲しみ（悲しい表情、頭を下げる）
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
            lookDown: 0,
          },
        },
        {
          time: 800,
          blendShapes: {
            sad: 0.6,
            lookDown: 0.4,
          },
        },
        {
          time: 2000,
          blendShapes: {
            sad: 0.7,
            lookDown: 0.5,
          },
        },
      ],
    },
    gesture: {
      name: "sad_gesture",
      duration: 2500,
      loop: false,
      easing: "ease-in-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
            Spine: {
              rotation: [0, 0, 0],
            },
          },
        },
        {
          time: 1000,
          bones: {
            Head: {
              rotation: [-0.2, 0, 0], // 頭を下げる
            },
            LeftShoulder: {
              rotation: [0.1, 0, 0.1], // 肩を落とす
            },
            RightShoulder: {
              rotation: [0.1, 0, -0.1],
            },
            Spine: {
              rotation: [0.05, 0, 0], // 少し前かがみ
            },
          },
        },
        {
          time: 2500,
          bones: {
            Head: {
              rotation: [-0.15, 0, 0],
            },
            LeftShoulder: {
              rotation: [0.08, 0, 0.08],
            },
            RightShoulder: {
              rotation: [0.08, 0, -0.08],
            },
            Spine: {
              rotation: [0.03, 0, 0],
            },
          },
        },
      ],
    },
  },
};

// 怒り（怒った表情、眉間にしわ）
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
            neutral: 1,
            lookDown: 0,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 400,
          blendShapes: {
            neutral: 0.3,
            lookDown: 0.8, // 眉間にしわを寄せる表現
            blinkLeft: 0.3, // 目を細める
            blinkRight: 0.3,
          },
        },
        {
          time: 1200,
          blendShapes: {
            neutral: 0.4,
            lookDown: 0.7,
            blinkLeft: 0.2,
            blinkRight: 0.2,
          },
        },
      ],
    },
    gesture: {
      name: "angry_gesture",
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
            LeftShoulder: {
              rotation: [0, 0, 0],
            },
            RightShoulder: {
              rotation: [0, 0, 0],
            },
            LeftHand: {
              rotation: [0, 0, 0],
            },
            RightHand: {
              rotation: [0, 0, 0],
            },
          },
        },
        {
          time: 300,
          bones: {
            Head: {
              rotation: [0.05, 0, 0], // 少し前に出す
            },
            LeftShoulder: {
              rotation: [0, 0, -0.1], // 肩を張る
            },
            RightShoulder: {
              rotation: [0, 0, 0.1],
            },
            LeftHand: {
              rotation: [0.2, 0, 0], // 拳を握る動作
            },
            RightHand: {
              rotation: [0.2, 0, 0],
            },
          },
        },
        {
          time: 1500,
          bones: {
            Head: {
              rotation: [0.02, 0, 0],
            },
            LeftShoulder: {
              rotation: [0, 0, -0.05],
            },
            RightShoulder: {
              rotation: [0, 0, 0.05],
            },
            LeftHand: {
              rotation: [0.1, 0, 0],
            },
            RightHand: {
              rotation: [0.1, 0, 0],
            },
          },
        },
      ],
    },
  },
};

// 驚き（驚いた表情、頭を後ろに引く）
const surprisedAnimation: EmotionAnimation = {
  emotion: "surprised",
  intensity: 1.0,
  animations: {
    facial: {
      name: "surprised_facial",
      duration: 1000,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          blendShapes: {
            neutral: 1,
            lookUp: 0,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 200,
          blendShapes: {
            neutral: 0.5,
            lookUp: 0.7, // 目を見開く表現
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 600,
          blendShapes: {
            neutral: 0.7,
            lookUp: 0.5,
            blinkLeft: 0.8, // 驚きの瞬き
            blinkRight: 0.8,
          },
        },
        {
          time: 750,
          blendShapes: {
            neutral: 0.8,
            lookUp: 0.3,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
        {
          time: 1000,
          blendShapes: {
            neutral: 1,
            lookUp: 0,
            blinkLeft: 0,
            blinkRight: 0,
          },
        },
      ],
    },
    gesture: {
      name: "surprised_gesture",
      duration: 1200,
      loop: false,
      easing: "ease-out",
      keyframes: [
        {
          time: 0,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftArm: {
              rotation: [0, 0, 0],
            },
            RightArm: {
              rotation: [0, 0, 0],
            },
            Spine: {
              rotation: [0, 0, 0],
            },
          },
        },
        {
          time: 200,
          bones: {
            Head: {
              rotation: [-0.1, 0, 0], // 頭を後ろに引く
            },
            LeftArm: {
              rotation: [-0.3, 0, -0.2], // 手を上げる
            },
            RightArm: {
              rotation: [-0.3, 0, 0.2],
            },
            Spine: {
              rotation: [-0.05, 0, 0], // 少し後ろに反る
            },
          },
        },
        {
          time: 800,
          bones: {
            Head: {
              rotation: [-0.05, 0, 0],
            },
            LeftArm: {
              rotation: [-0.1, 0, -0.1],
            },
            RightArm: {
              rotation: [-0.1, 0, 0.1],
            },
            Spine: {
              rotation: [-0.02, 0, 0],
            },
          },
        },
        {
          time: 1200,
          bones: {
            Head: {
              rotation: [0, 0, 0],
            },
            LeftArm: {
              rotation: [0, 0, 0],
            },
            RightArm: {
              rotation: [0, 0, 0],
            },
            Spine: {
              rotation: [0, 0, 0],
            },
          },
        },
      ],
    },
  },
};

/**
 * 感情アニメーション辞書
 */
export const emotionAnimations: Record<string, EmotionAnimation> = {
  neutral: neutralAnimation,
  happy: happyAnimation,
  sad: sadAnimation,
  angry: angryAnimation,
  surprised: surprisedAnimation,
};

/**
 * 感情名から対応するアニメーションを取得
 */
export function getEmotionAnimation(
  emotion: string,
  intensity: number = 1.0
): EmotionAnimation | null {
  const baseAnimation = emotionAnimations[emotion];
  if (!baseAnimation) return null;

  // 強度に応じてアニメーションを調整
  return {
    ...baseAnimation,
    intensity,
    animations: {
      facial: adjustAnimationIntensity(
        baseAnimation.animations.facial,
        intensity
      ),
      gesture: adjustAnimationIntensity(
        baseAnimation.animations.gesture,
        intensity
      ),
      idle: baseAnimation.animations.idle
        ? adjustAnimationIntensity(baseAnimation.animations.idle, intensity)
        : undefined,
    },
  };
}

/**
 * アニメーション強度を調整
 */
function adjustAnimationIntensity(
  animation: AnimationSequence,
  intensity: number
): AnimationSequence {
  return {
    ...animation,
    keyframes: animation.keyframes.map((keyframe) => ({
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
                position: transform.position?.map((v) => v * intensity) as [
                  number,
                  number,
                  number
                ],
                rotation: transform.rotation?.map((v) => v * intensity) as [
                  number,
                  number,
                  number
                ],
                scale: transform.scale?.map((v) => 1 + (v - 1) * intensity) as [
                  number,
                  number,
                  number
                ],
              },
            ])
          )
        : undefined,
    })),
  };
}

/**
 * 利用可能な感情一覧を取得
 */
export function getAvailableEmotions(): string[] {
  return Object.keys(emotionAnimations);
}
