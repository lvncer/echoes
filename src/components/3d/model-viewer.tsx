"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { VRM } from "@pixiv/three-vrm";
import { Group } from "three";
import { Model3D, VRMModelInfo, GLTFModelInfo } from "@/lib/types/3d";
import { blendShapeService } from "@/lib/services/blend-shape-service";
import { getEmotionBridge } from "@/lib/services/emotion-bridge";
import { serviceContainer } from "@/lib/services/service-container";

const getAnimationController = () => {
  return serviceContainer.animationController;
};

interface ModelViewerProps {
  model: Model3D;
  animationSpeed?: number;
  enableAnimation?: boolean;
}

/**
 * 3Dモデル表示コンポーネント
 */
export function ModelViewer({ model, animationSpeed = 1 }: ModelViewerProps) {
  // VRMモデルの場合
  if (model.format === "vrm") {
    return <VRMViewer model={model as VRMModelInfo} animationSpeed={animationSpeed} />;
  }

  // glTF/GLBモデルの場合
  return <GLTFViewer model={model as GLTFModelInfo} />;
}

/**
 * VRMモデル表示
 */
function VRMViewer({ model, animationSpeed }: { model: VRMModelInfo; animationSpeed: number }) {
  const vrmRef = useRef<VRM | null>(null);

  useEffect(() => {
    if (model.vrm) {
      vrmRef.current = model.vrm;

      // ブレンドシェイプサービスにVRMモデルを登録
      blendShapeService.setVRM(model.vrm);

      // アニメーションコントローラーにVRMモデルを設定
      const animationController = getAnimationController();
      if (animationController) {
        animationController.setVRMModel(model.vrm);
      }

      // 感情ブリッジサービスにVRMモデルを設定
      const emotionBridge = getEmotionBridge();
      emotionBridge.setVRMModel(model.vrm);
    }
  }, [model.vrm, model.name]);

  // アニメーションループ
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (vrm) {
      // アニメーションコントローラーの更新を先に実行
      const animationController = getAnimationController();
      if (animationController) {
        // 現在時刻をミリ秒で取得
        const currentTime = performance.now();
        animationController.updateFrame(currentTime);
      }

      // VRMの更新（ボーン等の更新）
      vrm.update(delta * animationSpeed);

      // ブレンドシェイプの更新を強制実行
      if (vrm.expressionManager) {
        vrm.expressionManager.update();
      }

      // 簡単な待機アニメーション（上下に軽く動く）
      const time = state.clock.elapsedTime;
      vrm.scene.position.y = Math.sin(time * 0.5) * 0.02;

      // 軽い回転アニメーション（オプション）
      // vrm.scene.rotation.y = Math.sin(time * 0.2) * 0.1;
    }
  });

  if (!model.vrm) {
    return null;
  }

  return <primitive object={model.vrm.scene} />;
}

/**
 * glTF/GLBモデル表示
 */
function GLTFViewer({ model }: { model: GLTFModelInfo }) {
  const groupRef = useRef<Group>(null);

  // アニメーションループ
  useFrame((state) => {
    const group = groupRef.current;
    if (group) {
      // 簡単な待機アニメーション（上下に軽く動く）
      const time = state.clock.elapsedTime;
      group.position.y = Math.sin(time * 0.5) * 0.02;

      // 軽い回転アニメーション（オプション）
      // group.rotation.y = Math.sin(time * 0.2) * 0.1;
    }
  });

  if (!model.scene) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model.scene} />
    </group>
  );
}

/**
 * モデル情報表示（デバッグ用）
 */
export function ModelInfo({ model }: { model: Model3D }) {
  const info = {
    name: model.name,
    format: model.format.toUpperCase(),
    size: `${(model.size / 1024 / 1024).toFixed(2)} MB`,
    created: model.createdAt.toLocaleDateString(),
  };

  // VRM固有の情報
  if (model.format === "vrm") {
    const vrmModel = model as VRMModelInfo;
    if (vrmModel.meta) {
      Object.assign(info, {
        title: vrmModel.meta.title,
        author: vrmModel.meta.author,
        version: vrmModel.meta.version,
      });
    }
  }

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 text-white p-2 rounded-lg text-xs font-mono max-w-xs">
      <div className="space-y-1">
        <div className="flex gap-2">
          <span className="text-gray-300">Name:</span>
          <span className="truncate">{info.name}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-300">Format:</span>
          <span>{info.format}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-300">Size:</span>
          <span>{info.size}</span>
        </div>
        {/* VRM固有の情報 */}
        {model.format === "vrm" && (model as VRMModelInfo).meta?.title && (
          <div className="flex gap-2">
            <span className="text-gray-300">Title:</span>
            <span className="truncate">{(model as VRMModelInfo).meta?.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * モデルが読み込まれていない場合のプレースホルダー
 */
export function ModelPlaceholder() {
  // デフォルトモデルの読み込み中は何も表示しない
  return null;
}
