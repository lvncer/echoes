"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ModelSelector } from "@/components/3d/model-selector";
import Chat from "../chat";
import { Box, MessageCircle, Camera, Volume2, ChevronRight } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CameraSettings } from "./camera-settings";
import { VoiceSettings } from "./voice-settings";
import { useModelStore } from "@/lib/stores/model-store";
import { loadModel } from "@/lib/3d/loaders";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type SettingsCategory = "models" | "voice" | "camera" | "ai";

interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const categories: CategoryItem[] = [
  {
    id: "models",
    label: "3Dモデル",
    icon: Box,
    description: "VRM、glTF、GLBファイルの管理"
  },
  {
    id: "voice",
    label: "音声設定",
    icon: Volume2,
    description: "音声合成エンジンの設定"
  },
  {
    id: "camera",
    label: "カメラ・システム",
    icon: Camera,
    description: "3Dシーンとシステム設定"
  },
  {
    id: "ai",
    label: "AI設定",
    icon: MessageCircle,
    description: "Google Gemini API設定"
  }
];

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("models");
  
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

  const renderContent = () => {
    switch (activeCategory) {
      case "models":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                3Dモデル管理
              </h3>
              <p className="text-gray-400 mb-6">
                VRM、glTF、GLBファイルをアップロードして使用できます
              </p>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
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
        );

      case "voice":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                音声合成設定
              </h3>
              <p className="text-gray-400 mb-6">
                Web Speech APIとVOICEVOXの音声合成設定を行います
              </p>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <ErrorBoundary>
                  <VoiceSettings />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        );

      case "camera":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                カメラ・システム設定
              </h3>
              <p className="text-gray-400 mb-6">
                3Dシーンのカメラ設定とシステム管理を行います
              </p>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <ErrorBoundary>
                  <CameraSettings />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                AI チャット設定
              </h3>
              <p className="text-gray-400 mb-6">
                Google Gemini APIの設定を行います
              </p>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <ErrorBoundary>
                  <Chat />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="settings-modal-content min-h-[700px] max-h-[90vh] bg-gray-900 border-gray-700 text-white overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="text-2xl font-bold text-white">
            設定
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            3Dモデルの管理とAI設定を行います
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-full min-h-[600px]">
          {/* 左側サイドバー */}
          <div className="w-72 flex-shrink-0 border-r border-gray-700 bg-gray-800/30">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                カテゴリ
              </h4>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                          {category.label}
                        </div>
                        <div className={`text-xs mt-1 ${isActive ? "text-blue-100" : "text-gray-500 group-hover:text-gray-400"}`}>
                          {category.description}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive 
                          ? "text-white rotate-90" 
                          : "text-gray-500 group-hover:text-gray-400"
                      }`} />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 右側コンテンツエリア */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 