"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlendShapePanel } from "@/components/3d/blend-shape-panel";
import { LipSyncPanel } from "@/components/3d/lipsync-panel";
import { AdvancedLipSyncPanel } from "@/components/3d/advanced-lipsync-panel";
import { IntegratedLipSyncPanel } from "@/components/3d/integrated-lipsync-panel";
import { SimpleDebugPanel } from "@/components/3d/simple-debug-panel";
import { AnimationControlPanel } from "@/components/3d/animation-control-panel";
import { ModelSelector } from "@/components/3d/model-selector";
import Chat from "../../components/chat";
import { AudioChatControls } from "@/components/AudioChatControls";
import {
  Settings,
  MessageCircle,
  Mic,
  Palette,
  Zap,
  Bug,
  ArrowLeft,
  Box,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimationController } from "@/lib/services/animation-controller";
import { useModelStore } from "@/stores/model-store";
import { loadModel } from "@/lib/3d/loaders";

// アニメーションコントローラーの初期化
declare global {
  interface Window {
    __animationController?: AnimationController;
  }
}

const initializeAnimationController = () => {
  if (typeof window !== "undefined" && !window.__animationController) {
    window.__animationController = new AnimationController();
    console.log("🎭 アニメーションコントローラーを初期化しました");
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("models");

  // モデルストアから必要な関数を取得
  const {
    availableModels,
    currentModel,
    isLoading,
    addModel,
    removeModel,
    setCurrentModel,
    switchToModel,
    setLoading,
    setError,
  } = useModelStore();

  // ハイドレーション完了を検知
  useEffect(() => {
    // アニメーションコントローラーを初期化
    initializeAnimationController();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
            </Link>
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Echoes Settings
            </h1>
          </div>
          <p className="text-gray-600">
            AI設定、音声設定、アニメーション制御、デバッグ機能
          </p>
        </header>

        {/* 設定タブ */}
        <div className="bg-white rounded-lg shadow-lg">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-6 p-1">
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                モデル
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI設定
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                音声設定
              </TabsTrigger>
              <TabsTrigger
                value="animation"
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                アニメーション
              </TabsTrigger>
              <TabsTrigger
                value="blendshape"
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                ブレンドシェイプ
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                デバッグ
              </TabsTrigger>
            </TabsList>

            {/* 3Dモデル管理タブ */}
            <TabsContent value="models" className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    3Dモデル管理
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <ModelSelector
                        models={availableModels}
                        currentModel={currentModel}
                        onModelSelect={(model) => switchToModel(model.id)}
                        onModelUpload={async (file) => {
                          try {
                            setLoading(true);
                            setError(undefined);

                            const result = await loadModel(file);
                            if (result.success && result.model) {
                              addModel(result.model);
                              setCurrentModel(result.model);
                            } else {
                              throw new Error(
                                result.error || "モデルの読み込みに失敗しました"
                              );
                            }
                          } catch (error) {
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : "不明なエラーが発生しました";
                            setError(errorMessage);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        onModelDelete={(modelId) => removeModel(modelId)}
                        isLoading={isLoading}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* AI設定タブ */}
            <TabsContent value="ai" className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    AI チャット設定
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <Chat />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 音声設定タブ */}
            <TabsContent value="audio" className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    音声チャット制御
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <AudioChatControls />
                    </ErrorBoundary>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    リップシンク制御
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        基本リップシンク
                      </h3>
                      <LipSyncPanel />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        高精度リップシンク
                      </h3>
                      <AdvancedLipSyncPanel />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        統合リップシンク
                      </h3>
                      <IntegratedLipSyncPanel />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* アニメーション設定タブ */}
            <TabsContent value="animation" className="p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  アニメーション制御
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ErrorBoundary>
                    <AnimationControlPanel />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>

            {/* ブレンドシェイプ設定タブ */}
            <TabsContent value="blendshape" className="p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  ブレンドシェイプ制御
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ErrorBoundary>
                    <BlendShapePanel />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>

            {/* デバッグタブ */}
            <TabsContent value="debug" className="p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  デバッグ・テスト機能
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ErrorBoundary>
                    <SimpleDebugPanel />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
