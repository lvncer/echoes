import type { VRM } from "@pixiv/three-vrm";
import type { Object3D } from "three";
import type {
  AnimationSequence,
  AnimationInstance,
  AnimationControlSettings,
  AnimationState,
  AnimationEvents,
  KeyFrame,
} from "@/lib/types/animation";
import { AnimationPriority } from "@/lib/types/animation";

/**
 * ボーン変形情報の型
 */
interface BoneTransform {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

/**
 * アニメーション制御サービス
 * VRMモデルのブレンドシェイプとボーンを制御してアニメーションを実行
 */
export class AnimationController {
  private vrmModel: VRM | null = null;
  private activeAnimations: Map<string, AnimationInstance> = new Map();
  private events: Partial<AnimationEvents> = {};
  private isEnabled = true;
  private animationFrame: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private frameRate = 0;

  // パフォーマンス監視
  private calculationStartTime = 0;
  private calculationTime = 0;
  private memoryUsage = 0;

  // 設定
  private settings: AnimationControlSettings = {
    autoBlinking: {
      enabled: true,
      interval: [2000, 6000],
      intensity: 1.0,
    },
    breathing: {
      enabled: true,
      intensity: 0.5,
      speed: 1.0,
    },
    emotionAnimations: {
      enabled: true,
      intensity: 0.8,
      autoTrigger: true,
    },
    gestures: {
      enabled: true,
      handMovements: true,
      headMovements: true,
      bodyMovements: true,
      intensity: 0.7,
    },
  };

  // 自動アニメーション管理
  private autoBlinkTimer: NodeJS.Timeout | null = null;
  private breathingAnimationId: string | null = null;

  constructor() {
    this.startAnimationLoop();
  }

  /**
   * VRMモデルを設定
   */
  public setVRMModel(model: VRM): void {
    this.vrmModel = model;
    console.log("🎭 AnimationController: VRMモデルを設定しました");

    // 自動アニメーションを開始
    if (this.settings.autoBlinking.enabled) {
      this.startAutoBlinking();
    }
    if (this.settings.breathing.enabled) {
      this.startBreathingAnimation();
    }
  }

  /**
   * イベントリスナーを設定
   */
  public setEventListeners(events: Partial<AnimationEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * 設定を更新
   */
  public updateSettings(newSettings: Partial<AnimationControlSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // 自動アニメーションの状態を更新
    if (newSettings.autoBlinking?.enabled !== undefined) {
      if (newSettings.autoBlinking.enabled) {
        this.startAutoBlinking();
      } else {
        this.stopAutoBlinking();
      }
    }

    if (newSettings.breathing?.enabled !== undefined) {
      if (newSettings.breathing.enabled) {
        this.startBreathingAnimation();
      } else {
        this.stopBreathingAnimation();
      }
    }
  }

  /**
   * アニメーションを再生
   */
  public playAnimation(
    animation: AnimationSequence,
    priority: number = AnimationPriority.NORMAL
  ): string {
    if (!this.isEnabled || !this.vrmModel) {
      console.warn("⚠️ AnimationController: アニメーション再生不可");
      return "";
    }

    // 最大同時実行数チェック（3つまで）
    if (this.activeAnimations.size >= 3) {
      // 最も優先度の低いアニメーションを停止
      this.stopLowestPriorityAnimation();
    }

    const animationId = `anim_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const instance: AnimationInstance = {
      id: animationId,
      sequence: animation,
      startTime: performance.now(),
      currentTime: 0,
      priority,
      paused: false,
      completed: false,
    };

    this.activeAnimations.set(animationId, instance);
    this.events.onAnimationStart?.(animationId);

    console.log(
      `🎭 アニメーション開始: ${animation.name} (ID: ${animationId})`
    );
    return animationId;
  }

  /**
   * アニメーションを停止
   */
  public stopAnimation(animationId: string): void {
    const instance = this.activeAnimations.get(animationId);
    if (instance) {
      this.activeAnimations.delete(animationId);
      this.events.onAnimationEnd?.(animationId);
      console.log(`🛑 アニメーション停止: ${instance.sequence.name}`);
    }
  }

  /**
   * 全アニメーションを一時停止
   */
  public pauseAllAnimations(): void {
    this.activeAnimations.forEach((instance) => {
      instance.paused = true;
      this.events.onAnimationPause?.(instance.id);
    });
  }

  /**
   * 全アニメーションを再開
   */
  public resumeAllAnimations(): void {
    this.activeAnimations.forEach((instance) => {
      instance.paused = false;
      this.events.onAnimationResume?.(instance.id);
    });
  }

  /**
   * 自動瞬きを開始
   */
  public startAutoBlinking(): void {
    if (!this.vrmModel || this.autoBlinkTimer) return;

    const scheduleNextBlink = () => {
      const [minInterval, maxInterval] = this.settings.autoBlinking.interval;
      const interval =
        minInterval + Math.random() * (maxInterval - minInterval);

      this.autoBlinkTimer = setTimeout(() => {
        this.playBlinkAnimation();
        scheduleNextBlink();
      }, interval);
    };

    scheduleNextBlink();
    console.log("👁️ 自動瞬きを開始しました");
  }

  /**
   * 自動瞬きを停止
   */
  public stopAutoBlinking(): void {
    if (this.autoBlinkTimer) {
      clearTimeout(this.autoBlinkTimer);
      this.autoBlinkTimer = null;
      console.log("👁️ 自動瞬きを停止しました");
    }
  }

  /**
   * 呼吸アニメーションを開始
   */
  public startBreathingAnimation(): void {
    if (!this.vrmModel || this.breathingAnimationId) return;

    const breathingAnimation: AnimationSequence = {
      name: "breathing",
      duration: 4000 / this.settings.breathing.speed,
      loop: true,
      keyframes: [
        {
          time: 0,
          bones: {
            Spine: { position: [0, 0, 0] },
            UpperChest: { position: [0, 0, 0] },
          },
        },
        {
          time: 2000 / this.settings.breathing.speed,
          bones: {
            Spine: {
              position: [0, 0.002 * this.settings.breathing.intensity, 0],
            },
            UpperChest: {
              position: [0, 0.003 * this.settings.breathing.intensity, 0],
            },
          },
        },
        {
          time: 4000 / this.settings.breathing.speed,
          bones: {
            Spine: { position: [0, 0, 0] },
            UpperChest: { position: [0, 0, 0] },
          },
        },
      ],
      easing: "ease-in-out",
    };

    this.breathingAnimationId = this.playAnimation(
      breathingAnimation,
      AnimationPriority.LOW
    );
    console.log("🫁 呼吸アニメーションを開始しました");
  }

  /**
   * 呼吸アニメーションを停止
   */
  public stopBreathingAnimation(): void {
    if (this.breathingAnimationId) {
      this.stopAnimation(this.breathingAnimationId);
      this.breathingAnimationId = null;
      console.log("🫁 呼吸アニメーションを停止しました");
    }
  }

  /**
   * 瞬きアニメーションを実行
   */
  private playBlinkAnimation(): void {
    const blinkAnimation: AnimationSequence = {
      name: "auto-blink",
      duration: 250,
      loop: false,
      keyframes: [
        { time: 0, blendShapes: { Blink_L: 0, Blink_R: 0 } },
        {
          time: 150,
          blendShapes: {
            Blink_L: this.settings.autoBlinking.intensity,
            Blink_R: this.settings.autoBlinking.intensity,
          },
        },
        { time: 250, blendShapes: { Blink_L: 0, Blink_R: 0 } },
      ],
      easing: "ease-in-out",
    };

    this.playAnimation(blinkAnimation, AnimationPriority.NORMAL);
  }

  /**
   * 最も優先度の低いアニメーションを停止
   */
  private stopLowestPriorityAnimation(): void {
    let lowestPriority = Infinity;
    let lowestPriorityId = "";

    this.activeAnimations.forEach((instance, id) => {
      if (instance.priority < lowestPriority) {
        lowestPriority = instance.priority;
        lowestPriorityId = id;
      }
    });

    if (lowestPriorityId) {
      this.stopAnimation(lowestPriorityId);
    }
  }

  /**
   * アニメーションループを開始
   */
  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      this.calculationStartTime = performance.now();

      // フレームレート計算
      if (currentTime - this.lastFrameTime >= 1000) {
        this.frameRate = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }
      this.frameCount++;

      // アニメーション更新
      this.updateAnimations(currentTime);

      // パフォーマンス計算
      this.calculationTime = performance.now() - this.calculationStartTime;

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * アニメーションを更新
   */
  private updateAnimations(currentTime: number): void {
    if (!this.vrmModel || !this.isEnabled) return;

    const completedAnimations: string[] = [];

    this.activeAnimations.forEach((instance, id) => {
      if (instance.paused) return;

      instance.currentTime = currentTime - instance.startTime;

      // アニメーション完了チェック
      if (
        !instance.sequence.loop &&
        instance.currentTime >= instance.sequence.duration
      ) {
        completedAnimations.push(id);
        return;
      }

      // ループアニメーションの時間調整
      const animationTime = instance.sequence.loop
        ? instance.currentTime % instance.sequence.duration
        : Math.min(instance.currentTime, instance.sequence.duration);

      // キーフレーム補間とVRMモデル更新
      this.applyKeyFrameInterpolation(instance.sequence, animationTime);
    });

    // 完了したアニメーションを削除
    completedAnimations.forEach((id) => {
      const instance = this.activeAnimations.get(id);
      if (instance) {
        this.activeAnimations.delete(id);
        this.events.onAnimationEnd?.(id);

        // 呼吸アニメーションが完了した場合は再開
        if (
          id === this.breathingAnimationId &&
          this.settings.breathing.enabled
        ) {
          this.breathingAnimationId = null;
          this.startBreathingAnimation();
        }
      }
    });
  }

  /**
   * キーフレーム補間を適用
   */
  private applyKeyFrameInterpolation(
    sequence: AnimationSequence,
    time: number
  ): void {
    if (!this.vrmModel || sequence.keyframes.length === 0) return;

    // 現在時間に対応するキーフレームを見つける
    let prevFrame: KeyFrame | null = null;
    let nextFrame: KeyFrame | null = null;

    for (let i = 0; i < sequence.keyframes.length; i++) {
      const frame = sequence.keyframes[i];
      if (frame.time <= time) {
        prevFrame = frame;
      }
      if (frame.time >= time && !nextFrame) {
        nextFrame = frame;
        break;
      }
    }

    if (!prevFrame && !nextFrame) return;

    // 補間計算
    if (!nextFrame) {
      // 最後のフレーム
      this.applyKeyFrame(prevFrame!);
    } else if (!prevFrame) {
      // 最初のフレーム
      this.applyKeyFrame(nextFrame);
    } else if (prevFrame === nextFrame) {
      // 同じフレーム
      this.applyKeyFrame(prevFrame);
    } else {
      // 補間
      const t = (time - prevFrame.time) / (nextFrame.time - prevFrame.time);
      const easedT = this.applyEasing(t, sequence.easing || "linear");
      this.interpolateAndApplyKeyFrames(prevFrame, nextFrame, easedT);
    }
  }

  /**
   * キーフレームを適用
   */
  private applyKeyFrame(keyFrame: KeyFrame): void {
    if (!this.vrmModel) return;

    // ブレンドシェイプ適用
    if (keyFrame.blendShapes) {
      Object.entries(keyFrame.blendShapes).forEach(([shapeName, value]) => {
        const expressionManager = this.vrmModel!.expressionManager;
        if (expressionManager) {
          expressionManager.setValue(shapeName, value);
        }
      });
    }

    // ボーン変形適用
    if (keyFrame.bones) {
      Object.entries(keyFrame.bones).forEach(([boneName, transform]) => {
        const bone = this.findBone(boneName);
        if (bone) {
          if (transform.position) {
            bone.position.set(...transform.position);
          }
          if (transform.rotation) {
            bone.rotation.set(...transform.rotation);
          }
          if (transform.scale) {
            bone.scale.set(...transform.scale);
          }
        }
      });
    }
  }

  /**
   * キーフレーム間を補間して適用
   */
  private interpolateAndApplyKeyFrames(
    prevFrame: KeyFrame,
    nextFrame: KeyFrame,
    t: number
  ): void {
    if (!this.vrmModel) return;

    // ブレンドシェイプ補間
    const blendShapes: Record<string, number> = {};

    // 前フレームのブレンドシェイプ
    if (prevFrame.blendShapes) {
      Object.entries(prevFrame.blendShapes).forEach(([name, value]) => {
        blendShapes[name] = value * (1 - t);
      });
    }

    // 次フレームのブレンドシェイプ
    if (nextFrame.blendShapes) {
      Object.entries(nextFrame.blendShapes).forEach(([name, value]) => {
        blendShapes[name] = (blendShapes[name] || 0) + value * t;
      });
    }

    // ブレンドシェイプ適用
    Object.entries(blendShapes).forEach(([shapeName, value]) => {
      const expressionManager = this.vrmModel!.expressionManager;
      if (expressionManager) {
        expressionManager.setValue(shapeName, Math.max(0, Math.min(1, value)));
      }
    });

    // ボーン変形補間
    const bones: Record<string, BoneTransform> = {};

    if (prevFrame.bones) {
      Object.entries(prevFrame.bones).forEach(([boneName, transform]) => {
        bones[boneName] = { ...transform };
      });
    }

    if (nextFrame.bones) {
      Object.entries(nextFrame.bones).forEach(([boneName, transform]) => {
        if (!bones[boneName]) bones[boneName] = {};

        if (transform.position && bones[boneName].position) {
          bones[boneName].position = [
            bones[boneName].position![0] * (1 - t) + transform.position[0] * t,
            bones[boneName].position![1] * (1 - t) + transform.position[1] * t,
            bones[boneName].position![2] * (1 - t) + transform.position[2] * t,
          ];
        } else if (transform.position) {
          bones[boneName].position = transform.position.map(
            (v: number) => v * t
          ) as [number, number, number];
        }

        if (transform.rotation && bones[boneName].rotation) {
          bones[boneName].rotation = [
            bones[boneName].rotation![0] * (1 - t) + transform.rotation[0] * t,
            bones[boneName].rotation![1] * (1 - t) + transform.rotation[1] * t,
            bones[boneName].rotation![2] * (1 - t) + transform.rotation[2] * t,
          ];
        } else if (transform.rotation) {
          bones[boneName].rotation = transform.rotation.map(
            (v: number) => v * t
          ) as [number, number, number];
        }
      });
    }

    // ボーン変形適用
    Object.entries(bones).forEach(([boneName, transform]) => {
      const bone = this.findBone(boneName);
      if (bone) {
        if (transform.position) {
          bone.position.set(...transform.position);
        }
        if (transform.rotation) {
          bone.rotation.set(...transform.rotation);
        }
        if (transform.scale) {
          bone.scale.set(...transform.scale);
        }
      }
    });
  }

  /**
   * イージング関数を適用
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case "ease-in":
        return t * t;
      case "ease-out":
        return 1 - (1 - t) * (1 - t);
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      case "linear":
      default:
        return t;
    }
  }

  /**
   * ボーンを検索
   */
  private findBone(boneName: string): Object3D | null {
    if (!this.vrmModel) return null;

    // VRMモデルからボーンを検索
    const humanoid = this.vrmModel.humanoid;
    if (humanoid) {
      const bone = humanoid.getNormalizedBoneNode(
        boneName as keyof typeof humanoid.humanBones
      );
      if (bone) return bone;
    }

    // 直接検索
    return this.vrmModel.scene.getObjectByName(boneName) || null;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): AnimationState {
    const runningAnimations = {
      idle: null as string | null,
      emotion: null as string | null,
      gesture: null as string | null,
    };

    // 実行中のアニメーションを分類
    this.activeAnimations.forEach((instance) => {
      const name = instance.sequence.name;
      if (name.includes("blink") || name.includes("breathing")) {
        runningAnimations.idle = name;
      } else if (
        name.includes("emotion") ||
        name.includes("happy") ||
        name.includes("sad")
      ) {
        runningAnimations.emotion = name;
      } else {
        runningAnimations.gesture = name;
      }
    });

    return {
      activeAnimationCount: this.activeAnimations.size,
      frameRate: this.frameRate,
      calculationTime: this.calculationTime,
      memoryUsage: this.memoryUsage,
      runningAnimations,
    };
  }

  /**
   * 設定を取得
   */
  public getSettings(): AnimationControlSettings {
    return { ...this.settings };
  }

  /**
   * アニメーション制御を有効/無効化
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.activeAnimations.clear();
      this.stopAutoBlinking();
      this.stopBreathingAnimation();
    }
  }

  /**
   * リソースをクリーンアップ
   */
  public cleanup(): void {
    this.setEnabled(false);

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.activeAnimations.clear();
    this.vrmModel = null;

    console.log("🧹 AnimationController: クリーンアップ完了");
  }
}
