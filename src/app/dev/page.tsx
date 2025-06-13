"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlendShapePanel } from "@/components/3d/blend-shape-panel";
import { LipSyncPanel } from "@/components/3d/lipsync-panel";
import { AdvancedLipSyncPanel } from "@/components/3d/advanced-lipsync-panel";
import { IntegratedLipSyncPanel } from "@/components/3d/integrated-lipsync-panel";
import { SimpleDebugPanel } from "@/components/3d/simple-debug-panel";
import { AnimationControlPanel } from "@/components/3d/animation-control-panel";
import { Simple3DViewer } from "@/components/3d/model-3d-viewer";
import { AudioChatControls } from "@/components/AudioChatControls";
import {
  Code,
  Mic,
  Palette,
  Zap,
  Bug,
  ArrowLeft,
  Settings,
  Box,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimationController } from "@/lib/services/animation-controller";
import { useModelStore } from "@/stores/model-store";

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

export default function DevPage() {
  const [activeTab, setActiveTab] = useState("3d");

  // モデルストアから現在のモデルを取得
  const { currentModel } = useModelStore();

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
            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                設定に戻る
              </Button>
            </Link>
            <Code className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">開発者向け設定</h1>
          </div>
          <p className="text-gray-600">
            音声設定、アニメーション制御、ブレンドシェイプ、デバッグ機能
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 3Dモデル表示 */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  3Dモデル表示
                </h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                リアルタイムでアニメーションやブレンドシェイプの変化を確認
              </p>
            </div>
            <div className="h-[600px] relative">
              <ErrorBoundary>
                <Simple3DViewer
                  model={currentModel}
                  className="w-full h-full"
                  showInfo={true}
                />
              </ErrorBoundary>
              {!currentModel && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      3Dモデルが読み込まれていません
                    </p>
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        設定でモデルを選択
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側: 設定タブ */}
          <div className="bg-white rounded-lg shadow-lg">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full"
            >
              <TabsList className="grid w-full grid-cols-4 p-1">
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  音声
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
                  表情
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  デバッグ
                </TabsTrigger>
              </TabsList>

              {/* 音声設定タブ */}
              <TabsContent
                value="audio"
                className="p-6 h-[600px] overflow-y-auto"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      音声チャット制御
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ErrorBoundary>
                        <AudioChatControls />
                      </ErrorBoundary>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      リップシンク制御
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          基本リップシンク
                        </h4>
                        <LipSyncPanel />
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          高精度リップシンク
                        </h4>
                        <AdvancedLipSyncPanel />
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                          統合リップシンク
                        </h4>
                        <IntegratedLipSyncPanel />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* アニメーション設定タブ */}
              <TabsContent
                value="animation"
                className="p-6 h-[600px] overflow-y-auto"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    アニメーション制御
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <AnimationControlPanel />
                    </ErrorBoundary>
                  </div>
                </div>
              </TabsContent>

              {/* ブレンドシェイプ設定タブ */}
              <TabsContent
                value="blendshape"
                className="p-6 h-[600px] overflow-y-auto"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    ブレンドシェイプ制御
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <BlendShapePanel />
                    </ErrorBoundary>
                  </div>
                </div>
              </TabsContent>

              {/* デバッグタブ */}
              <TabsContent
                value="debug"
                className="p-6 h-[600px] overflow-y-auto"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    デバッグ・テスト機能
                  </h3>
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
      </div>
    </main>
  );
}
