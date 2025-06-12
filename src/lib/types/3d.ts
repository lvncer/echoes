import { VRM } from "@pixiv/three-vrm";
import { Group } from "three";

// サポートする3Dモデル形式
export type ModelFormat = "vrm" | "gltf" | "glb";

// 3Dモデルの基本情報
export interface ModelInfo {
  id: string;
  name: string;
  format: ModelFormat;
  size: number;
  url?: string;
  file?: File;
  thumbnail?: string;
  createdAt: Date;
  lastUsed?: Date;
  isDefault?: boolean; // デフォルトモデルかどうか
}

// VRMモデル固有の情報
export interface VRMModelInfo extends ModelInfo {
  format: "vrm";
  vrm?: VRM;
  meta?: {
    title?: string;
    author?: string;
    version?: string;
    description?: string;
    licenseUrl?: string;
    contactInformation?: string;
  };
}

// glTF/GLBモデル情報
export interface GLTFModelInfo extends ModelInfo {
  format: "gltf" | "glb";
  scene?: Group;
}

// 統合モデル情報
export type Model3D = VRMModelInfo | GLTFModelInfo;

// 3Dシーンの設定
export interface SceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  directionalLightPosition: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  enableShadows: boolean;
  enableOrbitControls: boolean;
}

// カメラ操作の設定
export interface CameraControlsConfig {
  enableZoom: boolean;
  enablePan: boolean;
  enableRotate: boolean;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

// アニメーション関連
export interface AnimationState {
  isPlaying: boolean;
  currentAnimation?: string;
  availableAnimations: string[];
  loop: boolean;
  speed: number;
}

// モデル表示状態
export interface ModelDisplayState {
  currentModel?: Model3D;
  availableModels: Model3D[];
  isLoading: boolean;
  error?: string;
  sceneConfig: SceneConfig;
  cameraConfig: CameraControlsConfig;
  animationState: AnimationState;
}

// モデル読み込みの結果
export interface ModelLoadResult {
  success: boolean;
  model?: Model3D;
  error?: string;
}

// ファイル読み込みのオプション
export interface LoadOptions {
  enableAnimations?: boolean;
  enableMorphTargets?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// 3Dビューアーのプロパティ
export interface Model3DViewerProps {
  model?: Model3D;
  sceneConfig?: Partial<SceneConfig>;
  cameraConfig?: Partial<CameraControlsConfig>;
  onModelLoad?: (result: ModelLoadResult) => void;
  onError?: (error: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

// モデル選択コンポーネントのプロパティ
export interface ModelSelectorProps {
  models: Model3D[];
  currentModel?: Model3D;
  onModelSelect: (model: Model3D) => void;
  onModelUpload: (file: File) => void;
  onModelDelete: (modelId: string) => void;
  isLoading?: boolean;
}

// デフォルト設定
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: "#f0f0f0",
  ambientLightIntensity: 0.6,
  directionalLightIntensity: 0.8,
  directionalLightPosition: [1, 1, 1],
  cameraPosition: [0, 1.6, 1.2], // より顔に近づける（Z軸を1.8から1.2に変更）
  cameraTarget: [0, 1.5, 0], // 顔の中心をターゲットに（Y軸を1.4から1.5に調整）
  enableShadows: true,
  enableOrbitControls: true,
};

export const DEFAULT_CAMERA_CONFIG: CameraControlsConfig = {
  enableZoom: true,
  enablePan: true,
  enableRotate: true,
  minDistance: 0.5, // さらに近くまで寄れるように（0.8から0.5に変更）
  maxDistance: 8,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  autoRotate: false,
  autoRotateSpeed: 2,
};

export const DEFAULT_ANIMATION_STATE: AnimationState = {
  isPlaying: false,
  availableAnimations: [],
  loop: true,
  speed: 1,
};
