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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            カメラ設定
          </CardTitle>
          <CardDescription>
            3Dシーンのカメラ位置とターゲットを確認できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">カメラ位置</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <code className="text-sm">
                  [{sceneConfig.cameraPosition.join(", ")}]
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">カメラターゲット</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <code className="text-sm">
                  [{sceneConfig.cameraTarget.join(", ")}]
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* モデル状態 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            モデル状態
          </CardTitle>
          <CardDescription>
            現在読み込まれているモデルの状態を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">利用可能モデル</label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{status.modelsCount}個</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">現在のモデル</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {currentModel ? currentModel.name : "なし"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">有効性</label>
              <div className="flex items-center gap-2">
                <Badge variant={status.hasValidCurrentModel ? "default" : "destructive"}>
                  {status.hasValidCurrentModel ? "有効" : "無効"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* システム操作 */}
      <Card>
        <CardHeader>
          <CardTitle>システム操作</CardTitle>
          <CardDescription>
            システムの初期化やリセットを行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              設定をリセット
            </Button>
            <Button
              onClick={handleClearStorage}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              ストレージクリア
            </Button>
            <Button
              onClick={handleForceInit}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              モデル強制初期化
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 ブラウザの開発者ツールでログを確認できます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 