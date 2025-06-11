"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { VRM } from "@pixiv/three-vrm";
import { Group } from "three";
import { Model3D, VRMModelInfo, GLTFModelInfo } from "@/lib/types/3d";

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
    return (
      <VRMViewer
        model={model as VRMModelInfo}
        animationSpeed={animationSpeed}
      />
    );
  }

  // glTF/GLBモデルの場合
  return <GLTFViewer model={model as GLTFModelInfo} />;
}

/**
 * VRMモデル表示
 */
function VRMViewer({
  model,
  animationSpeed,
}: {
  model: VRMModelInfo;
  animationSpeed: number;
}) {
  const vrmRef = useRef<VRM | null>(null);

  useEffect(() => {
    if (model.vrm) {
      vrmRef.current = model.vrm;
    }
  }, [model.vrm]);

  // アニメーションループ
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (vrm) {
      // VRMの更新（ボーン等の更新）
      vrm.update(delta * animationSpeed);

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
    <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm font-mono">
      <div className="space-y-1">
        {Object.entries(info).map(
          ([key, value]) =>
            value && (
              <div key={key} className="flex gap-2">
                <span className="text-gray-300 capitalize">{key}:</span>
                <span>{value}</span>
              </div>
            )
        )}
      </div>
    </div>
  );
}

/**
 * モデルが読み込まれていない場合のプレースホルダー
 */
export function ModelPlaceholder() {
  return (
    <group>
      {/* プレースホルダーのキューブ */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>

      {/* 頭部 */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>

      {/* 腕 */}
      <mesh position={[-0.7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>
      <mesh position={[0.7, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>

      {/* 脚 */}
      <mesh position={[-0.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>
      <mesh position={[0.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" wireframe />
      </mesh>
    </group>
  );
}
