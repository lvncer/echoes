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
  backgroundColor: "#f8f9fa", // より明るく自然な背景色
  ambientLightIntensity: 0.7, // 環境光を少し明るく
  directionalLightIntensity: 0.9, // メインライトを強化
  directionalLightPosition: [2, 3, 2], // より自然な照明角度
  cameraPosition: [0, 1.65, 1.8], // 最適な視点距離（顔全体が見える）
  cameraTarget: [0, 1.55, 0], // 顔の中心より少し上をターゲット
  enableShadows: true,
  enableOrbitControls: true,
};

export const DEFAULT_CAMERA_CONFIG: CameraControlsConfig = {
  enableZoom: true,
  enablePan: true,
  enableRotate: true,
  minDistance: 0.8, // 最小距離を調整（近すぎない）
  maxDistance: 10, // 最大距離を拡張
  minPolarAngle: Math.PI / 6, // 上からの視点を制限（30度）
  maxPolarAngle: (Math.PI * 5) / 6, // 下からの視点を制限（150度）
  autoRotate: false,
  autoRotateSpeed: 1.5, // 自動回転速度を調整
};

export const DEFAULT_ANIMATION_STATE: AnimationState = {
  isPlaying: false,
  availableAnimations: [],
  loop: true,
  speed: 1,
};
