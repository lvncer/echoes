/**
 * ジェスチャーアニメーション制御サービス
 * AnimationControllerからジェスチャー関連機能を分離
 */

import { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";

export type GestureType = "wave" | "nod" | "shake" | "point" | "clap";

export interface GestureConfig {
  duration: number;
  keyframes: Array<{
    time: number;
    rotations: Record<string, THREE.Euler>;
    positions?: Record<string, THREE.Vector3>;
  }>;
}

export class GestureAnimationController {
  private vrm: VRM | null = null;
  private isPlaying = false;

  public setVRM(vrm: VRM): void {
    this.vrm = vrm;
  }

  public playGestureAnimation(gestureType: GestureType, intensity: number = 1.0): void {
    if (!this.vrm || this.isPlaying) return;

    const config = this.getGestureConfig(gestureType);
    this.executeGesture(config, intensity);
  }

  private getGestureConfig(gestureType: GestureType): GestureConfig {
    const configs: Record<GestureType, GestureConfig> = {
      wave: {
        duration: 2000,
        keyframes: [
          {
            time: 0,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, -Math.PI / 4),
              rightLowerArm: new THREE.Euler(0, 0, -Math.PI / 3),
            },
          },
          {
            time: 0.5,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, -Math.PI / 6),
              rightLowerArm: new THREE.Euler(0, 0, -Math.PI / 4),
            },
          },
          {
            time: 1,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, 0),
              rightLowerArm: new THREE.Euler(0, 0, 0),
            },
          },
        ],
      },
      nod: {
        duration: 1000,
        keyframes: [
          {
            time: 0,
            rotations: {
              head: new THREE.Euler(0, 0, 0),
            },
          },
          {
            time: 0.5,
            rotations: {
              head: new THREE.Euler(Math.PI / 8, 0, 0),
            },
          },
          {
            time: 1,
            rotations: {
              head: new THREE.Euler(0, 0, 0),
            },
          },
        ],
      },
      shake: {
        duration: 1500,
        keyframes: [
          {
            time: 0,
            rotations: {
              head: new THREE.Euler(0, 0, 0),
            },
          },
          {
            time: 0.25,
            rotations: {
              head: new THREE.Euler(0, Math.PI / 12, 0),
            },
          },
          {
            time: 0.75,
            rotations: {
              head: new THREE.Euler(0, -Math.PI / 12, 0),
            },
          },
          {
            time: 1,
            rotations: {
              head: new THREE.Euler(0, 0, 0),
            },
          },
        ],
      },
      point: {
        duration: 1500,
        keyframes: [
          {
            time: 0,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, 0),
              rightLowerArm: new THREE.Euler(0, 0, 0),
            },
          },
          {
            time: 0.5,
            rotations: {
              rightUpperArm: new THREE.Euler(0, Math.PI / 4, -Math.PI / 2),
              rightLowerArm: new THREE.Euler(0, 0, 0),
            },
          },
          {
            time: 1,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, 0),
              rightLowerArm: new THREE.Euler(0, 0, 0),
            },
          },
        ],
      },
      clap: {
        duration: 1000,
        keyframes: [
          {
            time: 0,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, -Math.PI / 4),
              leftUpperArm: new THREE.Euler(0, 0, Math.PI / 4),
            },
          },
          {
            time: 0.3,
            rotations: {
              rightUpperArm: new THREE.Euler(0, Math.PI / 6, -Math.PI / 3),
              leftUpperArm: new THREE.Euler(0, -Math.PI / 6, Math.PI / 3),
            },
          },
          {
            time: 0.7,
            rotations: {
              rightUpperArm: new THREE.Euler(0, Math.PI / 6, -Math.PI / 3),
              leftUpperArm: new THREE.Euler(0, -Math.PI / 6, Math.PI / 3),
            },
          },
          {
            time: 1,
            rotations: {
              rightUpperArm: new THREE.Euler(0, 0, 0),
              leftUpperArm: new THREE.Euler(0, 0, 0),
            },
          },
        ],
      },
    };

    return configs[gestureType];
  }

  private executeGesture(config: GestureConfig, intensity: number): void {
    if (!this.vrm) return;

    this.isPlaying = true;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.duration, 1);

      const currentKeyframe = this.getCurrentKeyframe(config.keyframes, progress);
      this.applyKeyframe(currentKeyframe, intensity);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isPlaying = false;
      }
    };

    animate();
  }

  private getCurrentKeyframe(keyframes: GestureConfig["keyframes"], progress: number) {
    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i];
      const next = keyframes[i + 1];

      if (progress >= current.time && progress <= next.time) {
        const localProgress = (progress - current.time) / (next.time - current.time);
        return this.interpolateKeyframes(current, next, localProgress);
      }
    }

    return keyframes[keyframes.length - 1];
  }

  private interpolateKeyframes(
    current: GestureConfig["keyframes"][0],
    next: GestureConfig["keyframes"][0],
    progress: number,
  ) {
    const interpolated = {
      time: progress,
      rotations: {} as Record<string, THREE.Euler>,
      positions: {} as Record<string, THREE.Vector3>,
    };

    Object.keys(current.rotations).forEach((boneName) => {
      const currentRot = current.rotations[boneName];
      const nextRot = next.rotations[boneName];

      if (nextRot) {
        interpolated.rotations[boneName] = new THREE.Euler(
          THREE.MathUtils.lerp(currentRot.x, nextRot.x, progress),
          THREE.MathUtils.lerp(currentRot.y, nextRot.y, progress),
          THREE.MathUtils.lerp(currentRot.z, nextRot.z, progress),
        );
      } else {
        interpolated.rotations[boneName] = currentRot.clone();
      }
    });

    return interpolated;
  }

  private applyKeyframe(
    keyframe: { rotations: Record<string, THREE.Euler> },
    intensity: number,
  ): void {
    if (!this.vrm) return;

    Object.entries(keyframe.rotations).forEach(([boneName, rotation]: [string, THREE.Euler]) => {
      const bone = this.findBone(boneName);
      if (bone) {
        bone.rotation.set(rotation.x * intensity, rotation.y * intensity, rotation.z * intensity);
      }
    });
  }

  private findBone(boneName: string): THREE.Object3D | null {
    if (!this.vrm) return null;

    const boneMap: Record<string, string> = {
      head: "head",
      rightUpperArm: "rightUpperArm",
      rightLowerArm: "rightLowerArm",
      leftUpperArm: "leftUpperArm",
      leftLowerArm: "leftLowerArm",
    };

    const actualBoneName = boneMap[boneName] || boneName;
    return (
      this.vrm.humanoid?.getNormalizedBoneNode(
        actualBoneName as keyof typeof this.vrm.humanoid.normalizedHumanBones,
      ) || null
    );
  }

  public isGesturePlaying(): boolean {
    return this.isPlaying;
  }
}
