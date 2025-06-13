"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Stats } from "@react-three/drei";
import { Suspense } from "react";
import { SceneConfig, CameraControlsConfig } from "@/lib/types/3d";

interface SceneProps {
  children?: React.ReactNode;
  sceneConfig: SceneConfig;
  cameraConfig: CameraControlsConfig;
  showStats?: boolean;
  showGrid?: boolean;
  className?: string;
}

/**
 * 基本的な3Dシーン
 */
export function Scene({
  children,
  sceneConfig,
  cameraConfig,
  showStats = false,
  showGrid = true,
  className = "w-full h-full",
}: SceneProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{
          position: sceneConfig.cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        shadows={sceneConfig.enableShadows}
        style={{ background: sceneConfig.backgroundColor }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]} // デバイスピクセル比を制限してパフォーマンス向上
        performance={{
          min: 0.5, // 最小フレームレート
        }}
      >
        {/* 統計情報（開発用） */}
        {showStats && <Stats />}

        {/* ライティング */}
        <Lighting config={sceneConfig} />

        {/* 環境 */}
        <Environment preset="studio" />

        {/* グリッド */}
        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.3}
            cellColor="#e0e0e0"
            sectionSize={5}
            sectionThickness={0.8}
            sectionColor="#c0c0c0"
            fadeDistance={15}
            fadeStrength={0.8}
            followCamera={false}
            infiniteGrid={true}
          />
        )}

        {/* カメラコントロール */}
        {sceneConfig.enableOrbitControls && (
          <OrbitControls
            target={sceneConfig.cameraTarget}
            enableZoom={cameraConfig.enableZoom}
            enablePan={cameraConfig.enablePan}
            enableRotate={cameraConfig.enableRotate}
            minDistance={cameraConfig.minDistance}
            maxDistance={cameraConfig.maxDistance}
            minPolarAngle={cameraConfig.minPolarAngle}
            maxPolarAngle={cameraConfig.maxPolarAngle}
            autoRotate={cameraConfig.autoRotate}
            autoRotateSpeed={cameraConfig.autoRotateSpeed}
            dampingFactor={0.05}
            enableDamping={true}
          />
        )}

        {/* 子要素（3Dモデルなど） */}
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      </Canvas>
    </div>
  );
}

/**
 * ライティング設定
 */
function Lighting({ config }: { config: SceneConfig }) {
  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={config.ambientLightIntensity} />

      {/* 指向性ライト */}
      <directionalLight
        position={config.directionalLightPosition}
        intensity={config.directionalLightIntensity}
        castShadow={config.enableShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* 補助光（キーライトの反対側） */}
      <directionalLight
        position={[
          -config.directionalLightPosition[0],
          config.directionalLightPosition[1],
          -config.directionalLightPosition[2],
        ]}
        intensity={config.directionalLightIntensity * 0.3}
        color="#ffffff"
      />
    </>
  );
}

/**
 * ローディング中の表示
 */
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

/**
 * デバッグ用のシンプルなキューブ
 */
export function DebugCube({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}

/**
 * 地面
 */
export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial 
        color="#ffffff" 
        roughness={0.8}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
