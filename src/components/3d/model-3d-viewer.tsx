"use client";

import { useState, useCallback } from "react";
import { useModelStore } from "@/stores/model-store";
import { loadModel } from "@/lib/3d/loaders";
import { Scene, Ground } from "./scene";
import { ModelViewer, ModelPlaceholder, ModelInfo } from "./model-viewer";
import { ModelSelector, ModelLoadingStatus } from "./model-selector";
import { Model3DViewerProps } from "@/lib/types/3d";

/**
 * 統合3Dモデルビューアー
 */
export function Model3DViewer({
  model,
  sceneConfig,
  cameraConfig,
  onModelLoad,
  onError,
  className = "w-full h-full",
  width,
  height,
}: Model3DViewerProps) {
  const {
    currentModel,
    availableModels,
    isLoading,
    error,
    sceneConfig: storeSceneConfig,
    cameraConfig: storeCameraConfig,
    setCurrentModel,
    addModel,
    removeModel,
    setLoading,
    setError,

    switchToModel,
  } = useModelStore();

  const [loadingProgress, setLoadingProgress] = useState<number>();

  // 使用する設定（propsが優先、なければストアの設定）
  const finalSceneConfig = { ...storeSceneConfig, ...sceneConfig };
  const finalCameraConfig = { ...storeCameraConfig, ...cameraConfig };

  // 表示するモデル（propsが優先、なければストアの現在のモデル）
  const displayModel = model || currentModel;

  // モデルアップロードハンドラー
  const handleModelUpload = useCallback(
    async (file: File) => {
      try {
        setLoading(true);
        setError(undefined);
        setLoadingProgress(0);

        // プログレス監視の設定
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev === undefined) return 0.1;
            if (prev >= 0.9) return 0.9;
            return prev + 0.1;
          });
        }, 200);

        // モデルを読み込み
        const result = await loadModel(file);

        clearInterval(progressInterval);
        setLoadingProgress(1);

        if (result.success && result.model) {
          // ストアに追加
          addModel(result.model);

          // 現在のモデルとして設定
          setCurrentModel(result.model);

          // コールバック実行
          onModelLoad?.(result);

          setTimeout(() => {
            setLoadingProgress(undefined);
          }, 500);
        } else {
          throw new Error(result.error || "モデルの読み込みに失敗しました");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラーが発生しました";
        setError(errorMessage);
        onError?.(errorMessage);
        setLoadingProgress(undefined);
      } finally {
        setLoading(false);
      }
    },
    [addModel, setCurrentModel, setLoading, setError, onModelLoad, onError]
  );

  // モデル選択ハンドラー
  const handleModelSelect = useCallback(
    (selectedModel: (typeof availableModels)[0]) => {
      switchToModel(selectedModel.id);
    },
    [switchToModel]
  );

  // モデル削除ハンドラー
  const handleModelDelete = useCallback(
    (modelId: string) => {
      removeModel(modelId);
    },
    [removeModel]
  );

  return (
    <div className={className} style={{ width, height }}>
      <div className="flex h-full gap-4">
        {/* 3Dビューアー */}
        <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
          <Scene
            sceneConfig={finalSceneConfig}
            cameraConfig={finalCameraConfig}
            showStats={process.env.NODE_ENV === "development"}
            showGrid={true}
            className="w-full h-full"
          >
            {/* 地面 */}
            <Ground />

            {/* モデル表示 */}
            {displayModel ? (
              <ModelViewer
                model={displayModel}
                animationSpeed={1}
                enableAnimation={true}
              />
            ) : (
              <ModelPlaceholder />
            )}
          </Scene>

          {/* モデル情報オーバーレイ */}
          {displayModel && <ModelInfo model={displayModel} />}

          {/* 読み込み状況オーバーレイ */}
          <div className="absolute bottom-4 left-4 right-4">
            <ModelLoadingStatus
              isLoading={isLoading}
              progress={loadingProgress}
              error={error}
            />
          </div>
        </div>

        {/* サイドパネル */}
        <div className="w-80 flex-shrink-0">
          <ModelSelector
            models={availableModels}
            currentModel={displayModel}
            onModelSelect={handleModelSelect}
            onModelUpload={handleModelUpload}
            onModelDelete={handleModelDelete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * シンプルな3Dビューアー（サイドパネルなし）
 */
export function Simple3DViewer({
  model,
  sceneConfig,
  cameraConfig,
  className = "w-full h-full",
  showInfo = false,
}: Omit<Model3DViewerProps, "onModelLoad" | "onError"> & {
  showInfo?: boolean;
}) {
  const { sceneConfig: storeSceneConfig, cameraConfig: storeCameraConfig } =
    useModelStore();

  const finalSceneConfig = { ...storeSceneConfig, ...sceneConfig };
  const finalCameraConfig = { ...storeCameraConfig, ...cameraConfig };

  return (
    <div className={className}>
      <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full">
        <Scene
          sceneConfig={finalSceneConfig}
          cameraConfig={finalCameraConfig}
          showStats={false}
          showGrid={true}
          className="w-full h-full"
        >
          <Ground />

          {model ? (
            <ModelViewer
              model={model}
              animationSpeed={1}
              enableAnimation={true}
            />
          ) : (
            <ModelPlaceholder />
          )}
        </Scene>

        {/* モデル情報オーバーレイ */}
        {showInfo && model && <ModelInfo model={model} />}
      </div>
    </div>
  );
}
