"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelSelector } from "@/components/3d/model-selector";
import Chat from "../chat";
import { Box, MessageCircle, Camera, Volume2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CameraSettings } from "./camera-settings";
import { VoiceSettings } from "./voice-settings";
import { useModelStore } from "@/lib/stores/model-store";
import { loadModel } from "@/lib/3d/loaders";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const {
    availableModels,
    currentModel,
    isLoading,
    addModel,
    removeModel,
    switchToModel,
    setLoading,
    setError,
  } = useModelStore();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl min-h-[600px] max-h-[90vh] bg-white/90 backdrop-blur-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            設定
          </DialogTitle>
          <DialogDescription>
            3Dモデルの管理とAI設定を行います
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="models" className="h-full">
            <TabsList className="grid w-full grid-cols-4 p-1">
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                3Dモデル
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                音声設定
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                カメラ・システム
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI設定
              </TabsTrigger>
            </TabsList>

            {/* 3Dモデル管理タブ */}
            <TabsContent value="models" className="p-4 min-h-[400px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    3Dモデル管理
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
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
                            } else {
                              throw new Error(result.error || "モデルの読み込みに失敗");
                            }
                          } catch (error) {
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : "不明なエラーが発生";
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

            {/* 音声設定タブ */}
            <TabsContent value="voice" className="p-4 min-h-[400px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    音声合成設定
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Web Speech APIとVOICEVOXの音声合成設定を行います
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <VoiceSettings />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* カメラ・システム設定タブ */}
            <TabsContent value="camera" className="p-4 min-h-[400px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    カメラ・システム設定
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    3Dシーンのカメラ設定とシステム管理を行います
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ErrorBoundary>
                      <CameraSettings />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* AI設定タブ */}
            <TabsContent value="ai" className="p-4 min-h-[400px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    AI チャット設定
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
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
      </DialogContent>
    </Dialog>
  );
} 