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
import { getEmotionAnimation } from "@/lib/animations/emotion-animations";
import {
  getGestureAnimation,
  type GestureType,
  type GestureCategory,
  getAllGestures,
  getGesturesByCategory as getGesturesByCategoryFromAnimations,
  getGestureDescription as getGestureDescriptionFromAnimations,
} from "@/lib/animations/gesture-animations";
import {
  emotionAnalyzer,
  type EmotionAnalysisResult,
} from "@/lib/services/emotion-analyzer";
import { blendShapeService } from "@/lib/services/blend-shape-service";

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
  private maxCalculationTime = 10; // ms - CPU負荷制限
  private performanceHistory: Array<{
    timestamp: number;
    frameRate: number;
    calculationTime: number;
    memoryUsage: number;
    activeAnimations: number;
  }> = [];
  private maxHistorySize = 100; // 最大100フレーム分の履歴

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
    autoSalute: {
      enabled: true,
      interval: 15000, // 15秒
      intensity: 1.0,
      neutralOnly: true,
      disableDuringSpeech: true, // 音声合成中は無効化
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
  private autoSaluteTimer: NodeJS.Timeout | null = null;
  private isSpeaking = false; // 音声合成中の状態管理
  private breathingAnimationId: string | null = null;
  private currentEmotionAnimationId: string | null = null;
  private currentGestureAnimationId: string | null = null;
  private lastEmotionAnalysis: EmotionAnalysisResult | null = null;

  constructor() {
    // アニメーションループは外部から制御されるため、ここでは開始しない
    // this.startAnimationLoop();
  }

  /**
   * VRMモデルを設定
   */
  public setVRMModel(model: VRM): void {
    console.log('[AnimationController] VRMモデルを設定:', !!model);
    this.vrmModel = model;
    
    if (model) {
      console.log('[AnimationController] VRMモデル設定完了、自動アニメーションを開始');
      
      // VRMモデルが設定されたら自動アニメーションを開始（重複実行を防ぐ）
      if (!this.animationFrame) {
        console.log('[AnimationController] アニメーションループを開始');
        this.startAnimationLoop();
      } else {
        console.log('[AnimationController] アニメーションループは既に実行中');
      }
      
      // 自動ジェスチャーを開始
      if (this.settings.autoSalute.enabled && !this.isSpeaking) {
        console.log('[AnimationController] 自動サルートアニメーションを開始');
        this.startAutoSalute();
      }
    }

    // ブレンドシェイプサービスにもVRMモデルを設定
    blendShapeService.setVRM(model);

    // 利用可能なブレンドシェイプ名を確認
    if (model.expressionManager) {
      const expressions = model.expressionManager.expressions;
      const expressionNames = Object.keys(expressions);

      // VRMExpressionManagerの詳細情報を取得
      const manager = model.expressionManager as unknown as {
        expressionMap?: Record<string, unknown>;
      };
      if (manager.expressionMap) {
        Object.entries(manager.expressionMap);
      }

      // 瞬き関連のブレンドシェイプを特に確認
      const _blinkExpressions = expressionNames.filter(
        (name) =>
          name.toLowerCase().includes("blink") ||
          name.toLowerCase().includes("eye")
      );

      // 標準的なVRMブレンドシェイプ名をテスト
      const standardBlendShapes = [
        "blink",
        "blinkLeft",
        "blinkRight",
        "Blink_L",
        "Blink_R",
        "eye_close_L",
        "eye_close_R",
      ];
      standardBlendShapes.forEach((name) => {
        try {
          const value = model.expressionManager!.getValue(name);
          if (value !== undefined) {
          }
        } catch {
          // 存在しない場合は無視
        }
      });
    }

    // デフォルト姿勢を自然な状態に調整
    this.applyNaturalDefaultPose();

    // 自動アニメーションを開始
    if (this.settings.autoBlinking.enabled) {
      this.startAutoBlinking();
    }
    if (this.settings.breathing.enabled) {
      this.startBreathingAnimation();
    }
    if (this.settings.autoSalute.enabled) {
      this.startAutoSalute();
    }
  }

  /**
   * デフォルト姿勢を自然な状態に調整
   * 特に手の位置を下げて人間として自然な立ち姿勢を実現
   */
  private applyNaturalDefaultPose(): void {
    if (!this.vrmModel) return;

    const humanoid = this.vrmModel.humanoid;
    if (!humanoid) {
      return;
    }

    // ジェスチャーアニメーションで使用されているボーン名と設定値を参考にした自然な立ち姿勢
    const naturalPoseAdjustments = {
      // 腕・手の位置調整（腕を後ろで組むポーズ）
      LeftShoulder: { rotation: [0, 0, 0] }, // 肩は基本姿勢
      RightShoulder: { rotation: [0, 0, 0] },
      LeftUpperArm: { rotation: [-0.1, -0.5, 1.3] }, // 腕を後ろに回す
      RightUpperArm: { rotation: [-0.1, 0.5, -1.3] },
      LeftLowerArm: { rotation: [-0.1, -0.5, 0.0] }, // 肘を曲げて手を腰の後ろに
      RightLowerArm: { rotation: [-0.1, 0.5, -0.0] },
      LeftHand: { rotation: [0, 0, 0] }, // 手も基本姿勢
      RightHand: { rotation: [0, 0, 0] },

      // 体幹の調整（基本姿勢）
      Spine: { rotation: [0, 0, 0] },
      Chest: { rotation: [0, 0, 0] },
      UpperChest: { rotation: [0, 0, 0] },

      // 頭の位置調整（基本姿勢）
      Neck: { rotation: [0, 0, 0] },
      Head: { rotation: [0, 0, 0] },
    };

    let _adjustedBones = 0;
    let _failedBones = 0;

    // 各ボーンに自然な姿勢を適用
    Object.entries(naturalPoseAdjustments).forEach(([boneName, transform]) => {
      const bone = this.findBone(boneName);
      if (bone) {
        try {
          if (transform.rotation) {
            // 絶対的な回転を設定（相対的ではなく）
            bone.rotation.x = transform.rotation[0];
            bone.rotation.y = transform.rotation[1];
            bone.rotation.z = transform.rotation[2];
            _adjustedBones++;
          }
        } catch (_error) {
          _failedBones++;
        }
      } else {
        _failedBones++;
      }
    });
  }

  /**
   * 利用可能なボーン一覧をデバッグ出力（開発環境のみ）
   */
  private logAvailableBones(): void {
    if (process.env.NODE_ENV !== "development" || !this.vrmModel) return;

    const humanoid = this.vrmModel.humanoid;
    if (!humanoid) return;

    // VRMのHumanoidボーン名を確認
    const humanoidBoneNames = [
      "head",
      "neck",
      "spine",
      "upperChest",
      "chest",
      "leftShoulder",
      "rightShoulder",
      "leftUpperArm",
      "leftLowerArm",
      "leftHand",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand",
      "leftUpperLeg",
      "leftLowerLeg",
      "leftFoot",
      "rightUpperLeg",
      "rightLowerLeg",
      "rightFoot",
    ];

    const availableBones: string[] = [];
    const unavailableBones: string[] = [];

    humanoidBoneNames.forEach((boneName) => {
      const bone = humanoid.getNormalizedBoneNode(
        boneName as keyof typeof humanoid.humanBones
      );
      if (bone) {
        availableBones.push(boneName);
      } else {
        unavailableBones.push(boneName);
      }
    });
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

      // 感情アニメーションの場合は、ブレンドシェイプをリセット
      if (animationId === this.currentEmotionAnimationId) {
        this.resetEmotionBlendShapes();
        this.currentEmotionAnimationId = null;
      }
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
  }

  /**
   * 自動瞬きを停止
   */
  public stopAutoBlinking(): void {
    if (this.autoBlinkTimer) {
      clearTimeout(this.autoBlinkTimer);
      this.autoBlinkTimer = null;
    }
  }

  /**
   * 自動ラジャーを開始
   */
  public startAutoSalute(): void {
    console.log('[AnimationController] startAutoSalute実行中...', {
      hasVRMModel: !!this.vrmModel,
      hasExistingTimer: !!this.autoSaluteTimer,
      isEnabled: this.isEnabled
    });
    
    if (!this.vrmModel || this.autoSaluteTimer) {
      console.log('[AnimationController] startAutoSalute条件に引っかかり処理をスキップ', {
        vrmModelMissing: !this.vrmModel,
        timerExists: !!this.autoSaluteTimer
      });
      return;
    }

    const scheduleNextSalute = () => {
      console.log('[AnimationController] タイマーを設定中...', {
        interval: this.settings.autoSalute.interval,
        isSpeaking: this.isSpeaking,
        disableDuringSpeech: this.settings.autoSalute.disableDuringSpeech
      });
      
      this.autoSaluteTimer = setTimeout(() => {
        console.log('[AnimationController] タイマー実行中...', {
          isSpeaking: this.isSpeaking,
          disableDuringSpeech: this.settings.autoSalute.disableDuringSpeech,
          neutralOnly: this.settings.autoSalute.neutralOnly,
          lastEmotion: this.lastEmotionAnalysis?.emotion,
          timestamp: new Date().toISOString()
        });
        
        // 音声合成中はスキップ（二重チェック）
        if (this.isSpeaking) {
          console.log('[AnimationController] 音声合成中のためスキップ（二重チェック）、次回スケジュール');
          scheduleNextSalute();
          return;
        }
        
        // 設定による音声合成中チェック
        if (this.settings.autoSalute.disableDuringSpeech && this.isSpeaking) {
          console.log('[AnimationController] 音声合成中のためスキップ（設定チェック）、次回スケジュール');
          scheduleNextSalute();
          return;
        }

        // ニュートラル感情時のみ実行
        if (this.settings.autoSalute.neutralOnly) {
          if (
            this.lastEmotionAnalysis &&
            this.lastEmotionAnalysis.emotion !== "neutral"
          ) {
            console.log('[AnimationController] ニュートラル感情でないためスキップ、次回スケジュール');
            // ニュートラルでない場合は次回まで待機
            scheduleNextSalute();
            return;
          }
        }

        console.log('[AnimationController] ラジャーアニメーションを実行中...');
        // ラジャーアニメーションを実行
        this.playSaluteAnimation();
        scheduleNextSalute();
      }, this.settings.autoSalute.interval);
      
      console.log('[AnimationController] タイマー設定完了:', !!this.autoSaluteTimer);
    };

    scheduleNextSalute();
  }

  /**
   * 自動ラジャーを停止
   */
  public stopAutoSalute(): void {
    if (this.autoSaluteTimer) {
      clearTimeout(this.autoSaluteTimer);
      this.autoSaluteTimer = null;
    }
  }

  /**
   * ラジャーアニメーションを実行
   */
  private playSaluteAnimation(): void {
    console.log('[AnimationController] playSaluteAnimation実行中...', {
      hasVRMModel: !!this.vrmModel,
      isEnabled: this.isEnabled,
      isSpeaking: this.isSpeaking,
      timestamp: new Date().toISOString()
    });
    
    // 音声合成中は実行しない（最終防御線）
    if (this.isSpeaking) {
      console.log('[AnimationController] 音声合成中のためplaySaluteAnimationをスキップ（最終防御線）');
      return;
    }
    
    if (!this.vrmModel || !this.isEnabled) {
      console.log('[AnimationController] playSaluteAnimation条件に引っかかり処理をスキップ', {
        vrmModelMissing: !this.vrmModel,
        isDisabled: !this.isEnabled
      });
      return;
    }

    console.log('[AnimationController] ニュートラルジェスチャーアニメーションをインポート中...');
    // ニュートラルジェスチャーからラジャーアニメーションを取得
    import("../animations/gestures/neutral-gestures").then(({ getNeutralGestureAnimation }) => {
      console.log('[AnimationController] ニュートラルジェスチャーアニメーションインポート完了、アニメーションを取得中...');
      const saluteAnimation = getNeutralGestureAnimation("salute");
      console.log('[AnimationController] サルートアニメーション取得結果:', !!saluteAnimation);
      
      if (saluteAnimation) {
        console.log('[AnimationController] サルートアニメーションを再生開始...');
        const animationId = this.playAnimation(saluteAnimation, AnimationPriority.NORMAL);
        console.log('[AnimationController] サルートアニメーションID:', animationId);
      } else {
        console.error('[AnimationController] サルートアニメーションが見つかりません');
      }
    }).catch((error) => {
      console.error('[AnimationController] ニュートラルジェスチャーインポートエラー:', error);
    });
  }

  /**
   * 音声合成状態を設定
   */
  public setSpeaking(speaking: boolean): void {
    console.log(`[AnimationController] setSpeaking: ${speaking}, previous state: ${this.isSpeaking}, timestamp: ${new Date().toISOString()}`);
    
    // 状態変更前の処理
    if (speaking && !this.isSpeaking) {
      // 音声合成開始：即座にタイマーをクリア
      console.log('[AnimationController] 音声合成開始 - 即座にタイマーをクリア');
      if (this.autoSaluteTimer) {
        clearTimeout(this.autoSaluteTimer);
        this.autoSaluteTimer = null;
        console.log('[AnimationController] 既存タイマーを強制クリア');
      }
    }
    
    this.isSpeaking = speaking;
    
    // 音声合成開始時は定期ジェスチャーを一時停止
    if (speaking) {
      console.log('[AnimationController] 音声合成開始 - 定期ジェスチャーを一時停止');
      this.pausePeriodicGestures();
    } else {
      console.log('[AnimationController] 音声合成終了 - 定期ジェスチャーを再開');
      // 音声合成終了時は定期ジェスチャーを再開
      this.resumePeriodicGestures();
    }
  }

  /**
   * 定期ジェスチャーを一時停止
   */
  private pausePeriodicGestures(): void {
    console.log('[AnimationController] 定期ジェスチャーを一時停止中...', {
      hadSaluteTimer: !!this.autoSaluteTimer
    });
    
    // ラジャーアニメーションを一時停止（瞬きと呼吸は継続）
    this.stopAutoSalute();
    
    console.log('[AnimationController] 定期ジェスチャー一時停止完了', {
      saluteTimerCleared: !this.autoSaluteTimer
    });
  }

  /**
   * 定期ジェスチャーを再開
   */
  private resumePeriodicGestures(): void {
    console.log('[AnimationController] 定期ジェスチャーを再開中...', {
      autoSaluteEnabled: this.settings.autoSalute.enabled,
      autoSaluteTimer: !!this.autoSaluteTimer,
      isSpeaking: this.isSpeaking,
      timestamp: new Date().toISOString()
    });
    
    // 音声合成が確実に終了していることを確認
    if (this.isSpeaking) {
      console.log('[AnimationController] まだ音声合成中のため定期ジェスチャー再開をスキップ');
      return;
    }
    
    // ラジャーアニメーションを再開
    if (this.settings.autoSalute.enabled) {
      console.log('[AnimationController] 敬礼タイマーを再開');
      this.startAutoSalute();
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
  }

  /**
   * 呼吸アニメーションを停止
   */
  public stopBreathingAnimation(): void {
    if (this.breathingAnimationId) {
      this.stopAnimation(this.breathingAnimationId);
      this.breathingAnimationId = null;
    }
  }

  /**
   * AI応答テキストから感情を解析してアニメーション実行
   */
  public analyzeAndPlayEmotionAnimation(text: string): void {
    if (!this.isEnabled || !this.settings.emotionAnimations.enabled) {
      return;
    }

    // 感情解析
    const analysis = emotionAnalyzer.analyzeWithContext(text);
    this.lastEmotionAnalysis = analysis;

    // 信頼度が低い場合はスキップ
    if (analysis.confidence < 0.4) {
      return;
    }

    // ニュートラルの場合は現在の感情アニメーションを停止
    if (analysis.emotion === "neutral") {
      this.stopCurrentEmotionAnimation();
      return;
    }

    // 感情アニメーションを取得
    const emotionAnimation = getEmotionAnimation(
      analysis.emotion,
      analysis.intensity * this.settings.emotionAnimations.intensity
    );

    if (!emotionAnimation) {
      return;
    }

    // 現在の感情アニメーションを停止
    this.stopCurrentEmotionAnimation();

    // 新しいアニメーション開始前にブレンドシェイプをクリア
    this.resetEmotionBlendShapes();

    // 表情アニメーションを実行
    const facialAnimationId = this.playAnimation(
      emotionAnimation.animations.facial,
      AnimationPriority.HIGH
    );

    // ジェスチャーアニメーションを実行
    this.playAnimation(
      emotionAnimation.animations.gesture,
      AnimationPriority.NORMAL
    );

    // 現在の感情アニメーションIDを記録
    this.currentEmotionAnimationId = facialAnimationId;

    // イベント通知
    if (this.events.onEmotionAnimationStart) {
      this.events.onEmotionAnimationStart(analysis.emotion, analysis.intensity);
    }
  }

  /**
   * 現在の感情アニメーションを停止
   */
  public stopCurrentEmotionAnimation(): void {
    if (this.currentEmotionAnimationId) {
      this.stopAnimation(this.currentEmotionAnimationId);
      this.currentEmotionAnimationId = null;
    }

    // ブレンドシェイプをニュートラル状態にリセット
    this.resetEmotionBlendShapes();
  }

  /**
   * 手動で感情アニメーションを実行
   */
  public playEmotionAnimation(
    emotion: "neutral" | "happy" | "sad" | "angry" | "surprised",
    intensity: number = 1.0
  ): void {
    if (!this.isEnabled) {
      return;
    }

    if (!this.vrmModel) {
      return;
    }

    // 現在の感情アニメーションを停止（ブレンドシェイプリセット含む）
    this.stopCurrentEmotionAnimation();

    if (emotion === "neutral") {
      return;
    }

    const emotionAnimation = getEmotionAnimation(emotion, intensity);

    if (!emotionAnimation) {
      return;
    }

    // 新しいアニメーション開始前にブレンドシェイプをクリア
    this.resetEmotionBlendShapes();

    // 表情アニメーションを実行
    const facialAnimationId = this.playAnimation(
      emotionAnimation.animations.facial,
      AnimationPriority.HIGH
    );

    // ジェスチャーアニメーションを実行
    this.playAnimation(
      emotionAnimation.animations.gesture,
      AnimationPriority.NORMAL
    );

    // 現在の感情アニメーションIDを記録
    this.currentEmotionAnimationId = facialAnimationId;
  }

  /**
   * 最後の感情解析結果を取得
   */
  public getLastEmotionAnalysis(): EmotionAnalysisResult | null {
    return this.lastEmotionAnalysis;
  }

  /**
   * ジェスチャーアニメーションを再生
   */
  public playGestureAnimation(
    gestureType: GestureType,
    intensity: number = 1.0
  ): void {
    if (!this.vrmModel) {
      return;
    }

    if (!this.isEnabled) {
      return;
    }

    const gestureAnimation = getGestureAnimation(gestureType);

    if (!gestureAnimation) {
      return;
    }

    // 現在のジェスチャーアニメーションを停止
    if (this.currentGestureAnimationId) {
      this.stopAnimation(this.currentGestureAnimationId);
    }

    // 強度を適用したアニメーションを作成
    const adjustedAnimation = this.adjustGestureIntensity(
      gestureAnimation,
      intensity
    );

    // ジェスチャーアニメーションを実行
    const gestureAnimationId = this.playAnimation(
      adjustedAnimation,
      AnimationPriority.HIGH
    );
    this.currentGestureAnimationId = gestureAnimationId;

    // イベント通知
    this.events.onGestureAnimationStart?.(gestureType, intensity);
  }

  /**
   * 現在のジェスチャーアニメーションを停止
   */
  public stopCurrentGestureAnimation(): void {
    if (this.currentGestureAnimationId) {
      this.stopAnimation(this.currentGestureAnimationId);
      this.currentGestureAnimationId = null;
    }
  }

  /**
   * 利用可能なジェスチャー一覧を取得
   */
  public getAvailableGestures(): GestureType[] {
    return getAllGestures();
  }

  /**
   * カテゴリ別のジェスチャー一覧を取得
   */
  public getGesturesByCategory(category: GestureCategory): GestureType[] {
    return getGesturesByCategoryFromAnimations(category);
  }

  /**
   * ジェスチャーの説明を取得
   */
  public getGestureDescription(gestureType: GestureType): string {
    return getGestureDescriptionFromAnimations(gestureType);
  }

  /**
   * ジェスチャーアニメーションの強度を調整
   */
  private adjustGestureIntensity(
    animation: AnimationSequence,
    intensity: number
  ): AnimationSequence {
    return {
      ...animation,
      keyframes: animation.keyframes.map((keyframe) => ({
        ...keyframe,
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
                  scale: transform.scale?.map(
                    (v) => 1 + (v - 1) * intensity
                  ) as [number, number, number],
                },
              ])
            )
          : undefined,
      })),
    };
  }

  /**
   * 感情ブレンドシェイプをニュートラル状態にリセット
   */
  private resetEmotionBlendShapes(): void {
    if (!this.vrmModel?.expressionManager) return;

    const emotionBlendShapes = [
      "happy",
      "sad",
      "angry",
      "surprised",
      "neutral",
      "joy",
      "sorrow",
      "anger",
      "surprise",
      "fun",
      "smile",
      "frown",
      "mad",
      "shocked",
    ];

    emotionBlendShapes.forEach((shapeName) => {
      try {
        this.vrmModel!.expressionManager!.setValue(shapeName, 0);
      } catch {
        // ブレンドシェイプが存在しない場合は無視
      }
    });
  }

  /**
   * ボーン変形をリセット
   */
  private resetBoneTransforms(): void {
    if (!this.vrmModel) return;

    const humanoid = this.vrmModel.humanoid;
    if (!humanoid) return;

    // 全てのHumanoidボーンをリセット
    Object.values(humanoid.humanBones).forEach((bone) => {
      if (bone && bone.node) {
        const boneNode = bone.node;

        // 保存された元の状態に復元
        if (boneNode.userData.originalPosition) {
          boneNode.position.copy(boneNode.userData.originalPosition);
        }
        if (boneNode.userData.originalRotation) {
          boneNode.rotation.copy(boneNode.userData.originalRotation);
        }
        if (boneNode.userData.originalScale) {
          boneNode.scale.copy(boneNode.userData.originalScale);
        }
      }
    });
  }

  /**
   * デフォルト姿勢をリセットして自然な状態に戻す（公開メソッド）
   */
  public resetToNaturalPose(): void {
    if (!this.vrmModel) {
      return;
    }

    // 現在のボーン変形をリセット
    this.resetBoneTransforms();

    // 自然な姿勢を再適用
    this.applyNaturalDefaultPose();
  }

  /**
   * 瞬きアニメーションを実行
   */
  private playBlinkAnimation(): void {
    // VRMモデルで利用可能な瞬きブレンドシェイプを検出
    const blinkShapes = this.detectBlinkBlendShapes();

    if (blinkShapes.length === 0) {
      return;
    }

    // 検出されたブレンドシェイプを使用してアニメーション定義を作成
    const blinkAnimation: AnimationSequence = {
      name: "auto-blink",
      duration: 250, // 通常の瞬き時間に戻す
      loop: false,
      keyframes: [
        {
          time: 0,
          blendShapes: Object.fromEntries(
            blinkShapes.map((shape) => [shape, 0])
          ),
        },
        {
          time: 125, // 中間点
          blendShapes: Object.fromEntries(
            blinkShapes.map((shape) => [
              shape,
              this.settings.autoBlinking.intensity,
            ])
          ),
        },
        {
          time: 250,
          blendShapes: Object.fromEntries(
            blinkShapes.map((shape) => [shape, 0])
          ),
        },
      ],
      easing: "ease-in-out",
    };

    this.playAnimation(blinkAnimation, AnimationPriority.NORMAL);
  }

  /**
   * VRMモデルで利用可能な瞬きブレンドシェイプを検出
   */
  private detectBlinkBlendShapes(): string[] {
    if (!this.vrmModel?.expressionManager) {
      return [];
    }

    // ExpressionMapから実際のブレンドシェイプ名を取得
    const manager = this.vrmModel.expressionManager as unknown as {
      expressionMap?: Record<string, unknown>;
    };
    const availableExpressions = manager.expressionMap
      ? Object.keys(manager.expressionMap)
      : [];

    // 一般的な瞬きブレンドシェイプ名のパターン
    const blinkPatterns = [
      "blink",
      "Blink",
      "BLINK",
      "blinkLeft",
      "BlinkLeft",
      "blink_left",
      "Blink_L",
      "blinkRight",
      "BlinkRight",
      "blink_right",
      "Blink_R",
      "eye_close",
      "eyeClose",
      "EyeClose",
      "eye_close_L",
      "eye_close_R",
      "eyeCloseLeft",
      "eyeCloseRight",
    ];

    const detectedShapes: string[] = [];

    // パターンマッチングで瞬きブレンドシェイプを検出
    blinkPatterns.forEach((pattern) => {
      if (availableExpressions.includes(pattern)) {
        detectedShapes.push(pattern);
      }
    });

    // パターンマッチングで見つからない場合、名前に'blink'や'eye'を含むものを検索
    if (detectedShapes.length === 0) {
      availableExpressions.forEach((name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("blink") || lowerName.includes("eye")) {
          detectedShapes.push(name);
        }
      });
    }

    // フォールバック: 数字のブレンドシェイプから推測（最後の手段）
    if (detectedShapes.length === 0) {
      const expressions = this.vrmModel.expressionManager.expressions;
      const expressionNames = Object.keys(expressions);

      if (expressionNames.some((name) => /^\d+$/.test(name))) {
        // 一般的にVRMでは最初の数個が基本表情（瞬きを含む）の場合が多い
        if (expressionNames.includes("0")) {
          detectedShapes.push("0");
        }
        if (expressionNames.includes("1")) {
          detectedShapes.push("1");
        }
      }
    }

    return detectedShapes;
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
   * 外部から呼び出されるアニメーション更新メソッド
   */
  public updateFrame(currentTime: number): void {
    this.calculationStartTime = performance.now();

    // フレームレート計算
    if (currentTime - this.lastFrameTime >= 1000) {
      this.frameRate = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = currentTime;

      // メモリ使用量監視（概算）
      if (typeof window !== "undefined" && "memory" in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number } })
          .memory;
        if (memory) {
          this.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        }
      }
    }
    this.frameCount++;

    // CPU負荷制限チェック
    if (this.activeAnimations.size > 3) {
      this.enforceAnimationLimit();
    }

    // アニメーション更新
    this.updateAnimations(currentTime);

    // パフォーマンス計算
    this.calculationTime = performance.now() - this.calculationStartTime;

    // パフォーマンス履歴記録
    this.recordPerformanceMetrics(currentTime);

    // CPU負荷制限チェック（ログ出力なし）
    if (this.calculationTime > this.maxCalculationTime) {
      // パフォーマンス履歴に記録するのみ
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

        // メモリ使用量監視（概算）
        if (typeof window !== "undefined" && "memory" in performance) {
          const memory = (
            performance as { memory?: { usedJSHeapSize: number } }
          ).memory;
          if (memory) {
            this.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
          }
        }
      }
      this.frameCount++;

      // CPU負荷制限チェック
      if (this.activeAnimations.size > 3) {
        this.enforceAnimationLimit();
      }

      // アニメーション更新
      this.updateAnimations(currentTime);

      // パフォーマンス計算
      this.calculationTime = performance.now() - this.calculationStartTime;

      // パフォーマンス履歴記録
      this.recordPerformanceMetrics(currentTime);

      // CPU負荷制限チェック（ログ出力なし）
      if (this.calculationTime > this.maxCalculationTime) {
        // パフォーマンス履歴に記録するのみ
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * アニメーションを更新
   */
  private updateAnimations(currentTime: number): void {
    if (!this.vrmModel || !this.isEnabled) {
      return;
    }

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

        // 感情アニメーションが完了した場合はブレンドシェイプをリセット
        if (id === this.currentEmotionAnimationId) {
          this.resetEmotionBlendShapes();
          this.resetBoneTransforms();
          this.currentEmotionAnimationId = null;
        }

        // ジェスチャーアニメーションが完了した場合はボーンをリセット
        if (id === this.currentGestureAnimationId) {
          this.resetBoneTransforms();
          this.currentGestureAnimationId = null;
        }

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
    if (!this.vrmModel || sequence.keyframes.length === 0) {
      return;
    }

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

    // ブレンドシェイプ適用（自動マッピングによる適切な名前変換を使用）
    if (keyFrame.blendShapes) {
      blendShapeService.setMultipleBlendShapes(keyFrame.blendShapes);
    }

    // ボーン変形適用
    if (keyFrame.bones) {
      Object.entries(keyFrame.bones).forEach(([boneName, transform]) => {
        const bone = this.findBone(boneName);
        if (bone) {
          // 元の位置・回転・スケールを保存（初回のみ）
          if (!bone.userData.originalPosition) {
            bone.userData.originalPosition = bone.position.clone();
            bone.userData.originalRotation = bone.rotation.clone();
            bone.userData.originalScale = bone.scale.clone();
          }

          // 位置変更（加算ではなく、元の位置からの相対位置として設定）
          if (transform.position) {
            const originalPos = bone.userData.originalPosition;
            bone.position.set(
              originalPos.x + transform.position[0],
              originalPos.y + transform.position[1],
              originalPos.z + transform.position[2]
            );
          }

          // 回転変更（元の回転からの相対回転として設定）
          if (transform.rotation) {
            const originalRot = bone.userData.originalRotation;
            bone.rotation.set(
              originalRot.x + transform.rotation[0],
              originalRot.y + transform.rotation[1],
              originalRot.z + transform.rotation[2]
            );
          }

          // スケール変更
          if (transform.scale) {
            bone.scale.set(...transform.scale);
          }
        } else {
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

    // ブレンドシェイプ適用（自動マッピングによる適切な名前変換を使用）
    if (Object.keys(blendShapes).length > 0) {
      // 値を0-1の範囲にクランプ
      const clampedBlendShapes: Record<string, number> = {};
      Object.entries(blendShapes).forEach(([name, value]) => {
        clampedBlendShapes[name] = Math.max(0, Math.min(1, value));
      });
      blendShapeService.setMultipleBlendShapes(clampedBlendShapes);
    }

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
        // 元の位置・回転・スケールを保存（初回のみ）
        if (!bone.userData.originalPosition) {
          bone.userData.originalPosition = bone.position.clone();
          bone.userData.originalRotation = bone.rotation.clone();
          bone.userData.originalScale = bone.scale.clone();
        }

        // 位置変更（加算ではなく、元の位置からの相対位置として設定）
        if (transform.position) {
          const originalPos = bone.userData.originalPosition;
          bone.position.set(
            originalPos.x + transform.position[0],
            originalPos.y + transform.position[1],
            originalPos.z + transform.position[2]
          );
        }

        // 回転変更（元の回転からの相対回転として設定）
        if (transform.rotation) {
          const originalRot = bone.userData.originalRotation;
          bone.rotation.set(
            originalRot.x + transform.rotation[0],
            originalRot.y + transform.rotation[1],
            originalRot.z + transform.rotation[2]
          );
        }

        // スケール変更
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
      // VRMのHumanoidボーン名マッピング
      const boneMapping: Record<string, string> = {
        // 頭部
        Head: "head",
        Neck: "neck",

        // 胴体
        Spine: "spine",
        UpperChest: "upperChest",
        Chest: "chest",

        // 肩
        LeftShoulder: "leftShoulder",
        RightShoulder: "rightShoulder",

        // 腕
        LeftUpperArm: "leftUpperArm",
        LeftLowerArm: "leftLowerArm",
        LeftHand: "leftHand",
        RightUpperArm: "rightUpperArm",
        RightLowerArm: "rightLowerArm",
        RightHand: "rightHand",

        // 腕の別名
        LeftArm: "leftUpperArm",
        RightArm: "rightUpperArm",
        LeftForeArm: "leftLowerArm",
        RightForeArm: "rightLowerArm",

        // 脚
        LeftUpperLeg: "leftUpperLeg",
        LeftLowerLeg: "leftLowerLeg",
        LeftFoot: "leftFoot",
        RightUpperLeg: "rightUpperLeg",
        RightLowerLeg: "rightLowerLeg",
        RightFoot: "rightFoot",
      };

      // マッピングされたボーン名で検索
      const mappedBoneName = boneMapping[boneName] || boneName.toLowerCase();

      const bone = humanoid.getNormalizedBoneNode(
        mappedBoneName as keyof typeof humanoid.humanBones
      );
      if (bone) {
        return bone;
      }
    }

    // 直接検索（シーン内のオブジェクト名で検索）
    const directBone = this.vrmModel.scene.getObjectByName(boneName);
    if (directBone) {
      return directBone;
    }

    return null;
  }

  /**
   * アニメーション数制限を強制
   */
  private enforceAnimationLimit(): void {
    if (this.activeAnimations.size <= 3) return;

    // 優先度の低いアニメーションを停止
    const animations = Array.from(this.activeAnimations.entries()).sort(
      ([, a], [, b]) => a.priority - b.priority
    );

    const toRemove = animations.slice(0, this.activeAnimations.size - 3);
    toRemove.forEach(([id]) => {
      this.stopAnimation(id);
    });

    // アニメーション停止（ログ出力なし）
  }

  /**
   * パフォーマンス指標を記録
   */
  private recordPerformanceMetrics(currentTime: number): void {
    this.performanceHistory.push({
      timestamp: currentTime,
      frameRate: this.frameRate,
      calculationTime: this.calculationTime,
      memoryUsage: this.memoryUsage,
      activeAnimations: this.activeAnimations.size,
    });

    // 履歴サイズ制限
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  /**
   * パフォーマンス履歴を取得
   */
  public getPerformanceHistory(): Array<{
    timestamp: number;
    frameRate: number;
    calculationTime: number;
    memoryUsage: number;
    activeAnimations: number;
  }> {
    return [...this.performanceHistory];
  }

  /**
   * パフォーマンス統計を取得
   */
  public getPerformanceStats(): {
    averageFrameRate: number;
    averageCalculationTime: number;
    maxCalculationTime: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    averageActiveAnimations: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        averageFrameRate: 0,
        averageCalculationTime: 0,
        maxCalculationTime: 0,
        averageMemoryUsage: 0,
        maxMemoryUsage: 0,
        averageActiveAnimations: 0,
      };
    }

    const history = this.performanceHistory;
    return {
      averageFrameRate:
        history.reduce((sum, h) => sum + h.frameRate, 0) / history.length,
      averageCalculationTime:
        history.reduce((sum, h) => sum + h.calculationTime, 0) / history.length,
      maxCalculationTime: Math.max(...history.map((h) => h.calculationTime)),
      averageMemoryUsage:
        history.reduce((sum, h) => sum + h.memoryUsage, 0) / history.length,
      maxMemoryUsage: Math.max(...history.map((h) => h.memoryUsage)),
      averageActiveAnimations:
        history.reduce((sum, h) => sum + h.activeAnimations, 0) /
        history.length,
    };
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
    this.stopAutoSalute();
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
  }
}

// グローバルインスタンス管理
declare global {
  interface Window {
    __animationController?: AnimationController;
  }
}

// ヘルパー関数のエクスポート
export function getAvailableGestures(): GestureType[] {
  return getAllGestures();
}

export function getGesturesByCategory(
  category: GestureCategory
): GestureType[] {
  return getGesturesByCategoryFromAnimations(category);
}

export function getGestureDescription(gestureType: GestureType): string {
  return getGestureDescriptionFromAnimations(gestureType);
}

export function playGestureAnimation(
  gestureType: GestureType,
  intensity: number = 1.0
): void {
  if (typeof window !== "undefined" && window.__animationController) {
    window.__animationController.playGestureAnimation(gestureType, intensity);
  }
}
