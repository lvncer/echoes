/**
 * 感情アニメーション制御サービス
 * AnimationControllerから感情関連機能を分離
 */

import { VRM } from "@pixiv/three-vrm";
import { blendShapeService } from "./blend-shape-service";

export type EmotionType = "neutral" | "happy" | "sad" | "angry" | "surprised";

export interface EmotionConfig {
  intensity: number;
  duration: number;
  blendShapes: Record<string, number>;
}

export class EmotionAnimationController {
  private vrm: VRM | null = null;
  private currentEmotion: EmotionType = "neutral";
  private emotionIntensity = 1.0;

  public setVRM(vrm: VRM): void {
    this.vrm = vrm;
  }

  public analyzeAndPlayEmotionAnimation(text: string): void {
    const emotion = this.analyzeTextEmotion(text);
    this.playEmotionAnimation(emotion);
  }

  public playEmotionAnimation(emotion: EmotionType, intensity: number = 1.0): void {
    if (!this.vrm) return;

    this.currentEmotion = emotion;
    this.emotionIntensity = intensity;

    const emotionConfig = this.getEmotionConfig(emotion);
    this.applyEmotionBlendShapes(emotionConfig, intensity);
  }

  private analyzeTextEmotion(text: string): EmotionType {
    const emotionKeywords = {
      happy: ["嬉しい", "楽しい", "幸せ", "良い", "素晴らしい", "最高", "ありがとう"],
      sad: ["悲しい", "辛い", "残念", "寂しい", "泣く", "涙"],
      angry: ["怒り", "腹立つ", "むかつく", "イライラ", "許せない"],
      surprised: ["驚き", "びっくり", "まさか", "信じられない", "すごい"],
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return emotion as EmotionType;
      }
    }

    return "neutral";
  }

  private getEmotionConfig(emotion: EmotionType): EmotionConfig {
    const configs: Record<EmotionType, EmotionConfig> = {
      neutral: {
        intensity: 0,
        duration: 1000,
        blendShapes: {},
      },
      happy: {
        intensity: 0.8,
        duration: 2000,
        blendShapes: {
          joy: 0.8,
          aa: 0.3,
        },
      },
      sad: {
        intensity: 0.7,
        duration: 3000,
        blendShapes: {
          sorrow: 0.7,
          oh: 0.2,
        },
      },
      angry: {
        intensity: 0.9,
        duration: 1500,
        blendShapes: {
          angry: 0.9,
          ih: 0.4,
        },
      },
      surprised: {
        intensity: 1.0,
        duration: 1000,
        blendShapes: {
          surprised: 1.0,
          aa: 0.6,
        },
      },
    };

    return configs[emotion];
  }

  private applyEmotionBlendShapes(config: EmotionConfig, intensity: number): void {
    if (!this.vrm) return;

    Object.entries(config.blendShapes).forEach(([shapeName, value]) => {
      blendShapeService.setBlendShapeWeight(shapeName, value * intensity);
    });

    setTimeout(() => {
      this.resetToNeutral();
    }, config.duration);
  }

  private resetToNeutral(): void {
    if (!this.vrm) return;

    const neutralConfig = this.getEmotionConfig("neutral");
    Object.keys(neutralConfig.blendShapes).forEach((shapeName) => {
      blendShapeService.setBlendShapeWeight(shapeName, 0);
    });

    this.currentEmotion = "neutral";
  }

  public getCurrentEmotion(): EmotionType {
    return this.currentEmotion;
  }

  public getEmotionIntensity(): number {
    return this.emotionIntensity;
  }
}
