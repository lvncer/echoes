/**
 * アニメーション機能の型定義
 */

/**
 * アニメーションのキーフレーム
 */
export interface KeyFrame {
  /** キーフレームの時間（ミリ秒） */
  time: number;
  /** ブレンドシェイプの値（0-1） */
  blendShapes?: Record<string, number>;
  /** ボーンの変形情報 */
  bones?: Record<
    string,
    {
      position?: [number, number, number];
      rotation?: [number, number, number]; // オイラー角（ラジアン）
      scale?: [number, number, number];
    }
  >;
}

/**
 * アニメーションシーケンス
 */
export interface AnimationSequence {
  /** アニメーション名 */
  name: string;
  /** アニメーション時間（ミリ秒） */
  duration: number;
  /** ループするかどうか */
  loop: boolean;
  /** キーフレームの配列 */
  keyframes: KeyFrame[];
  /** イージング関数 */
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

/**
 * 感情アニメーション
 */
export interface EmotionAnimation {
  /** 感情の種類 */
  emotion: "neutral" | "happy" | "sad" | "angry" | "surprised";
  /** 感情の強度（0-1） */
  intensity: number;
  /** アニメーション構成 */
  animations: {
    /** 表情アニメーション */
    facial: AnimationSequence;
    /** ジェスチャーアニメーション */
    gesture: AnimationSequence;
    /** アイドルアニメーション（オプション） */
    idle?: AnimationSequence;
  };
}

/**
 * アニメーションインスタンス（実行中のアニメーション）
 */
export interface AnimationInstance {
  /** アニメーションID */
  id: string;
  /** アニメーションシーケンス */
  sequence: AnimationSequence;
  /** 開始時間（ミリ秒） */
  startTime: number;
  /** 現在の時間（ミリ秒） */
  currentTime: number;
  /** 優先度（高い値が優先） */
  priority: number;
  /** 一時停止中かどうか */
  paused: boolean;
  /** 完了したかどうか */
  completed: boolean;
}

/**
 * アニメーション制御設定
 */
export interface AnimationControlSettings {
  /** 基本アニメーション */
  autoBlinking: {
    enabled: boolean; // デフォルト: true
    interval: [number, number]; // [2000, 6000] ms
    intensity: number; // 0-1, デフォルト: 1.0
  };

  breathing: {
    enabled: boolean; // デフォルト: true
    intensity: number; // 0-1, デフォルト: 0.5
    speed: number; // 0.5-2.0, デフォルト: 1.0
  };

  /** 感情アニメーション */
  emotionAnimations: {
    enabled: boolean; // デフォルト: true
    intensity: number; // 0-1, デフォルト: 0.8
    autoTrigger: boolean; // AI応答連動, デフォルト: true
  };

  /** ジェスチャーアニメーション */
  gestures: {
    enabled: boolean; // デフォルト: true
    handMovements: boolean; // デフォルト: true
    headMovements: boolean; // デフォルト: true
    bodyMovements: boolean; // デフォルト: true
    intensity: number; // 0-1, デフォルト: 0.7
  };
}

/**
 * アニメーション状態
 */
export interface AnimationState {
  /** アクティブなアニメーション数 */
  activeAnimationCount: number;
  /** 現在のフレームレート */
  frameRate: number;
  /** アニメーション計算時間（ミリ秒） */
  calculationTime: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** 実行中のアニメーション */
  runningAnimations: {
    idle: string | null; // 瞬き/呼吸
    emotion: string | null; // 感情アニメーション
    gesture: string | null; // ジェスチャー
  };
}

/**
 * アニメーション補間タイプ
 */
export type InterpolationType = "linear" | "cubic" | "hermite";

/**
 * アニメーション優先度
 */
export enum AnimationPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

/**
 * アニメーションイベント
 */
export interface AnimationEvents {
  onAnimationStart?: (animationId: string) => void;
  onAnimationEnd?: (animationId: string) => void;
  onAnimationLoop?: (animationId: string) => void;
  onAnimationPause?: (animationId: string) => void;
  onAnimationResume?: (animationId: string) => void;
  onAnimationError?: (animationId: string, error: string) => void;
  onEmotionAnimationStart?: (emotion: string, intensity: number) => void;
}
