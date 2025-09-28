"use client";

import { useState, useEffect } from "react";
import { useAIStore } from "@/lib/stores/ai-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AIProvider, AIProviderConfig } from "@/lib/types/ai";

export function EnvironmentSettings() {
  const { settings, updateProviderConfig, switchProvider } = useAIStore();

  const [localConfig, setLocalConfig] = useState(settings.providers);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(
    settings.currentProvider.provider,
  );
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setLocalConfig(settings.providers);
    setCurrentProvider(settings.currentProvider.provider);
  }, [settings]);

  const handleProviderChange = (provider: AIProvider) => {
    setCurrentProvider(provider);
    setIsApplied(false);
  };

  const handleConfigChange = (
    provider: AIProvider,
    key: keyof AIProviderConfig,
    value: string | number | boolean,
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [key]: value,
      },
    }));
    setIsApplied(false);
  };

  const handleApplySettings = () => {
    if (!termsAccepted) {
      alert("利用規約に同意してください");
      return;
    }

    const activeProviderConfig = localConfig[currentProvider];
    if (!activeProviderConfig.apiKey && currentProvider !== "local") {
      alert(`${currentProvider.toUpperCase()} APIキーが必要です`);
      return;
    }

    // すべてのプロバイダー設定を更新
    Object.keys(localConfig).forEach((provider) => {
      updateProviderConfig(provider as AIProvider, localConfig[provider as AIProvider]);
    });

    // 現在のプロバイダーを切り替え
    switchProvider(currentProvider);

    setIsApplied(true);
    alert("設定が適用されました。");
  };

  const handleReset = () => {
    // デフォルト設定に戻すロジック（ストアにリセット機能を追加するのが望ましい）
    // ここでは簡易的に現在の設定をリロード
    window.location.reload();
  };

  const activeConfig = localConfig[currentProvider];

  return (
    <div className="space-y-4">
      {/* 警告メッセージ */}
      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">重要な注意事項</h4>
            <p className="text-sm text-yellow-300">
              設定はブラウザのローカルストレージに保存されます。
              公共のコンピューターでは使用を避け、定期的に設定をクリアすることを推奨します。
            </p>
          </div>
        </div>
      </div>

      {/* AI プロバイダー選択 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">AI プロバイダー設定</CardTitle>
          <CardDescription>使用するAIプロバイダーを選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">プロバイダー</label>
            <Select value={currentProvider} onValueChange={handleProviderChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="local">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(currentProvider === "openai" || currentProvider === "local") && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Base URL {currentProvider === "local" && "(ローカルAPI用)"}
              </label>
              <Input
                value={activeConfig.baseUrl || ""}
                onChange={(e) => handleConfigChange(currentProvider, "baseUrl", e.target.value)}
                placeholder={
                  currentProvider === "local"
                    ? "http://localhost:11434/v1"
                    : "https://api.openai.com/v1"
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* プロバイダー別設定 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">{currentProvider.toUpperCase()} 設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">API キー</label>
            <div className="flex gap-2">
              <Input
                type={showApiKeys ? "text" : "password"}
                value={activeConfig.apiKey || ""}
                onChange={(e) => handleConfigChange(currentProvider, "apiKey", e.target.value)}
                placeholder="APIキーを入力"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">モデル</label>
            {currentProvider === "gemini" ? (
              <Select
                value={activeConfig.model}
                onValueChange={(value) => handleConfigChange(currentProvider, "model", value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            ) : currentProvider === "openai" ? (
              <Select
                value={activeConfig.model}
                onValueChange={(value) => handleConfigChange(currentProvider, "model", value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={activeConfig.model}
                onChange={(e) => handleConfigChange(currentProvider, "model", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              最大トークン数: {activeConfig.maxTokens}
            </label>
            <Slider
              value={[activeConfig.maxTokens || 1000]}
              onValueChange={(value) => handleConfigChange(currentProvider, "maxTokens", value[0])}
              max={8000}
              min={100}
              step={100}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              温度設定: {activeConfig.temperature}
            </label>
            <Slider
              value={[activeConfig.temperature || 0.7]}
              onValueChange={(value) =>
                handleConfigChange(currentProvider, "temperature", value[0])
              }
              max={2}
              min={0}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-gray-700" />

      {/* 利用規約 */}
      <Card className="bg-red-900/20 border-red-600">
        <CardHeader>
          <CardTitle className="text-red-400">利用規約・セキュリティに関する重要事項</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-red-300 space-y-2">
            <p>
              • <strong>API キーの管理</strong>:
              APIキーは機密情報です。第三者と共有しないでください。
            </p>
            <p>
              • <strong>データの保存</strong>:
              設定データはブラウザのローカルストレージに保存されます。
            </p>
            <p>
              • <strong>セキュリティ</strong>:
              公共のコンピューターでは使用を避け、使用後は必ず設定をクリアしてください。
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
            />
            <label htmlFor="terms" className="text-sm text-red-300">
              上記の利用規約とセキュリティに関する事項に同意します
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 操作ボタン */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleApplySettings}
          disabled={!termsAccepted}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          設定を適用
        </Button>

        <Button
          variant="outline"
          onClick={handleReset}
          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          リセット
        </Button>

        {isApplied && (
          <Badge variant="secondary" className="bg-green-600 text-white">
            適用済み
          </Badge>
        )}
      </div>
    </div>
  );
}
