"use client";

import { useModelStore } from "@/lib/stores/model-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Monitor, RotateCcw, Trash2, RefreshCw } from "lucide-react";

export function CameraSettings() {
  const { 
    sceneConfig, 
    resetToDefaults, 
    getStorageStatus, 
    clearStorage, 
    forceInitialize,
    currentModel,
  } = useModelStore();

  const handleResetSettings = () => {
    // ローカルストレージをクリア
    localStorage.removeItem("echoes-model-store");
    // 設定をデフォルトにリセット
    resetToDefaults();
    // ページをリロード
    window.location.reload();
  };

  const handleClearStorage = async () => {
    clearStorage();
    localStorage.removeItem("echoes-model-store");
    console.log("🗑️ ストレージをクリアしました");
  };

  const handleForceInit = async () => {
    await forceInitialize();
    console.log("🔄 強制初期化を実行しました");
  };

  const status = getStorageStatus();

  return (
    <div className="space-y-6">
      {/* カメラ設定 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            カメラ設定
          </CardTitle>
          <CardDescription className="text-gray-400">
            3Dシーンのカメラ位置とターゲットを確認できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">カメラ位置</label>
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <code className="text-sm text-gray-300">
                  [{sceneConfig.cameraPosition.join(", ")}]
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">カメラターゲット</label>
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <code className="text-sm text-gray-300">
                  [{sceneConfig.cameraTarget.join(", ")}]
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* モデル状態 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Monitor className="w-5 h-5" />
            モデル状態
          </CardTitle>
          <CardDescription className="text-gray-400">
            現在読み込まれているモデルの状態を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">利用可能モデル</label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">
                  {status.modelsCount}個
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">現在のモデル</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {currentModel ? currentModel.name : "なし"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">有効性</label>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={status.hasValidCurrentModel ? "default" : "destructive"}
                  className={status.hasValidCurrentModel 
                    ? "bg-green-600 text-white border-green-500" 
                    : "bg-red-600 text-white border-red-500"
                  }
                >
                  {status.hasValidCurrentModel ? "有効" : "無効"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-gray-700" />

      {/* システム操作 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">システム操作</CardTitle>
          <CardDescription className="text-gray-400">
            システムの初期化やリセットを行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
              設定をリセット
            </Button>
            <Button
              onClick={handleClearStorage}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
              ストレージクリア
            </Button>
            <Button
              onClick={handleForceInit}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
              モデル強制初期化
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <p className="text-sm text-blue-300">
              💡 ブラウザの開発者ツールでログを確認できます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 