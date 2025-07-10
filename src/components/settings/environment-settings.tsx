"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnvironmentConfig {
  // OpenAI Settings
  openaiApiKey: string;
  openaiModel: string;
  openaiMaxTokens: number;
  openaiTemperature: number;

  // Gemini Settings
  geminiApiKey: string;
  geminiModel: string;
  geminiMaxTokens: number;
  geminiTemperature: number;

  // General Settings
  aiProvider: "openai" | "gemini" | "anthropic" | "local";
  aiBaseUrl: string; // OpenAI/Local用のみ
}

const DEFAULT_CONFIG: EnvironmentConfig = {
  openaiApiKey: "",
  openaiModel: "gpt-3.5-turbo",
  openaiMaxTokens: 1000,
  openaiTemperature: 0.7,
  geminiApiKey: "",
  geminiModel: "gemini-2.0-flash",
  geminiMaxTokens: 1000,
  geminiTemperature: 0.7,
  aiProvider: "gemini",
  aiBaseUrl: "https://api.openai.com/v1", // OpenAI用デフォルト
};

export function EnvironmentSettings() {
  const [config, setConfig] = useState<EnvironmentConfig>(() => {
    // セッションストレージから初期値を読み込み
    if (typeof window !== "undefined") {
      const sessionConfig = {
        openaiApiKey: sessionStorage.getItem("ENV_OPENAI_API_KEY") || "",
        openaiModel:
          sessionStorage.getItem("ENV_OPENAI_MODEL") ||
          DEFAULT_CONFIG.openaiModel,
        openaiMaxTokens:
          Number(sessionStorage.getItem("ENV_OPENAI_MAX_TOKENS")) ||
          DEFAULT_CONFIG.openaiMaxTokens,
        openaiTemperature:
          Number(sessionStorage.getItem("ENV_OPENAI_TEMPERATURE")) ||
          DEFAULT_CONFIG.openaiTemperature,
        geminiApiKey: sessionStorage.getItem("ENV_GEMINI_API_KEY") || "",
        geminiModel:
          sessionStorage.getItem("ENV_GEMINI_MODEL") ||
          DEFAULT_CONFIG.geminiModel,
        geminiMaxTokens:
          Number(sessionStorage.getItem("ENV_GEMINI_MAX_TOKENS")) ||
          DEFAULT_CONFIG.geminiMaxTokens,
        geminiTemperature:
          Number(sessionStorage.getItem("ENV_GEMINI_TEMPERATURE")) ||
          DEFAULT_CONFIG.geminiTemperature,
        aiProvider:
          (sessionStorage.getItem(
            "ENV_AI_PROVIDER"
          ) as EnvironmentConfig["aiProvider"]) || DEFAULT_CONFIG.aiProvider,
        aiBaseUrl:
          sessionStorage.getItem("ENV_AI_BASE_URL") || DEFAULT_CONFIG.aiBaseUrl,
      };
      return sessionConfig;
    }
    return DEFAULT_CONFIG;
  });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isApplied, setIsApplied] = useState(() => {
    // セッションストレージに設定があるかチェック
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("ENV_OPENAI_API_KEY") !== null ||
        sessionStorage.getItem("ENV_GEMINI_API_KEY") !== null
      );
    }
    return false;
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleConfigChange = (
    key: keyof EnvironmentConfig,
    value: EnvironmentConfig[keyof EnvironmentConfig]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsApplied(false);
  };

  const handleApplySettings = () => {
    if (!termsAccepted) {
      alert("利用規約に同意してください");
      return;
    }

    // 必要なAPIキーのチェック
    const requiredApiKey =
      config.aiProvider === "openai"
        ? config.openaiApiKey
        : config.aiProvider === "gemini"
        ? config.geminiApiKey
        : "";

    if (!requiredApiKey && config.aiProvider !== "local") {
      alert(`${config.aiProvider.toUpperCase()} APIキーが必要です`);
      return;
    }

    // 環境変数をセッションストレージに保存（セキュリティ上、sessionStorageを使用）
    Object.entries(config).forEach(([key, value]) => {
      const envKey = key.replace(/([A-Z])/g, "_$1").toUpperCase();
      sessionStorage.setItem(`ENV_${envKey}`, String(value));
    });

    setIsApplied(true);
    alert("設定が適用されました。この設定はブラウザを閉じるまで有効です。");
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setIsApplied(false);
    // セッションストレージをクリア
    Object.keys(config).forEach((key) => {
      const envKey = key.replace(/([A-Z])/g, "_$1").toUpperCase();
      sessionStorage.removeItem(`ENV_${envKey}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* 警告メッセージ */}
      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">重要な注意事項</h4>
            <p className="text-sm text-yellow-300">
              これらの設定はセッション中のみ保持され、ブラウザを閉じると削除されます。
              セキュリティのため、設定は保存されません。
            </p>
          </div>
        </div>
      </div>

      {/* AI プロバイダー選択 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">AI プロバイダー設定</CardTitle>
          <CardDescription>
            使用するAIプロバイダーを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              プロバイダー
            </label>
            <Select
              value={config.aiProvider}
              onValueChange={(value) => handleConfigChange("aiProvider", value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="local">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Base URLはOpenAI/Localの時のみ表示 */}
          {(config.aiProvider === "openai" ||
            config.aiProvider === "local") && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Base URL {config.aiProvider === "local" && "(ローカルAPI用)"}
              </label>
              <Input
                value={config.aiBaseUrl}
                onChange={(e) =>
                  handleConfigChange("aiBaseUrl", e.target.value)
                }
                placeholder={
                  config.aiProvider === "local"
                    ? "http://localhost:11434/v1"
                    : "https://api.openai.com/v1"
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                {config.aiProvider === "local"
                  ? "Ollama等のローカルAPIのエンドポイントを指定"
                  : "OpenAI互換APIのエンドポイントを指定"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI 設定 - OpenAI選択時のみ表示 */}
      {(config.aiProvider === "openai" || config.aiProvider === "local") && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">OpenAI 設定</CardTitle>
            <CardDescription>OpenAI API の設定を行います</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                API キー
              </label>
              <div className="flex gap-2">
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value={config.openaiApiKey}
                  onChange={(e) =>
                    handleConfigChange("openaiApiKey", e.target.value)
                  }
                  placeholder="sk-..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {showApiKeys ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                モデル
              </label>
              <Select
                value={config.openaiModel}
                onValueChange={(value) =>
                  handleConfigChange("openaiModel", value)
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                最大トークン数: {config.openaiMaxTokens}
              </label>
              <Slider
                value={[config.openaiMaxTokens]}
                onValueChange={(value) =>
                  handleConfigChange("openaiMaxTokens", value[0])
                }
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                温度設定: {config.openaiTemperature}
              </label>
              <Slider
                value={[config.openaiTemperature]}
                onValueChange={(value) =>
                  handleConfigChange("openaiTemperature", value[0])
                }
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gemini 設定 - Gemini選択時のみ表示 */}
      {config.aiProvider === "gemini" && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Google Gemini 設定</CardTitle>
            <CardDescription>
              Google Gemini API の設定を行います
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                API キー
              </label>
              <div className="flex gap-2">
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value={config.geminiApiKey}
                  onChange={(e) =>
                    handleConfigChange("geminiApiKey", e.target.value)
                  }
                  placeholder="AIza..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {showApiKeys ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                モデル
              </label>
              <Select
                value={config.geminiModel}
                onValueChange={(value) =>
                  handleConfigChange("geminiModel", value)
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.0-flash">
                    Gemini 2.0 Flash
                  </SelectItem>
                  <SelectItem value="gemini-1.5-flash">
                    Gemini 1.5 Flash
                  </SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                最大トークン数: {config.geminiMaxTokens}
              </label>
              <Slider
                value={[config.geminiMaxTokens]}
                onValueChange={(value) =>
                  handleConfigChange("geminiMaxTokens", value[0])
                }
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                温度設定: {config.geminiTemperature}
              </label>
              <Slider
                value={[config.geminiTemperature]}
                onValueChange={(value) =>
                  handleConfigChange("geminiTemperature", value[0])
                }
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="bg-gray-700" />

      {/* 利用規約 */}
      <Card className="bg-red-900/20 border-red-600">
        <CardHeader>
          <CardTitle className="text-red-400">
            利用規約・セキュリティに関する重要事項
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-red-300 space-y-2">
            <p>
              • <strong>API キーの管理</strong>:
              APIキーは機密情報です。第三者と共有しないでください。
            </p>
            <p>
              • <strong>データの保存</strong>:
              設定データはセッション中のみ保持され、ブラウザを閉じると自動的に削除されます。
            </p>
            <p>
              • <strong>セキュリティ</strong>:
              公共のコンピューターでは使用を避け、使用後は必ずブラウザを閉じてください。
            </p>
            <p>
              • <strong>責任</strong>:
              APIキーの不正使用による損害について、本アプリケーションは責任を負いません。
            </p>
            <p>
              • <strong>使用料金</strong>:
              API使用料金は各プロバイダーの規約に従って課金されます。
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
