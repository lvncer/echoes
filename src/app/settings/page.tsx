"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelSelector } from "@/components/3d/model-selector";
import Chat from "../../components/chat";
import {
  Settings,
  MessageCircle,
  ArrowLeft,
  Box,
  Code,
  ExternalLink,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useModelStore } from "@/stores/model-store";
import { loadModel } from "@/lib/3d/loaders";

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-4xl">
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
            <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          </div>
          <p className="text-gray-600">3Dモデルの管理とAI設定を行います</p>
        </header>

        {/* 設定タブ */}
        <div className="bg-white rounded-lg shadow-lg">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                3Dモデル
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI設定
              </TabsTrigger>
            </TabsList>

            {/* 3Dモデル管理タブ */}
            <TabsContent value="models" className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    3Dモデル管理
                  </h2>
                  <p className="text-gray-600 mb-4">
                    VRM、glTF、GLBファイルをアップロードして使用できます
                  </p>
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
                  <p className="text-gray-600 mb-4">
                    Google Gemini APIの設定を行います
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <Chat />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 開発用設定へのリンク */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Code className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                開発者向け設定
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                音声設定、アニメーション制御、ブレンドシェイプ、デバッグ機能などの詳細設定にアクセスできます。
              </p>
              <Link href="/dev">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="w-4 h-4" />
                  開発用設定を開く
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
