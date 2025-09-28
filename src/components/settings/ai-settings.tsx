"use client";

import { useState, useEffect } from "react";
import { useAIStore } from "@/lib/stores/ai-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw } from "lucide-react";
import { EmotionChat } from "../chat/emotion-chat";

// カスタムプロンプト設定のデフォルト値を定義（コンポーネント外で定義）
const defaultCustomPrompt = {
  enabled: true,
  content: `あなたは親しみやすく、知識豊富なAIアシスタントです。ユーザーの質問に対して丁寧で分かりやすい回答を心がけてください。`,
  lastUpdated: new Date(),
};

export function AISettings() {
  const { settings, updateCustomPrompt } = useAIStore();

  const [promptText, setPromptText] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Zustandの永続化復元を待つ
  useEffect(() => {
    // 少し遅延を入れて永続化復元を待つ
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [settings]);

  // 復元完了後に設定を読み込み
  useEffect(() => {
    if (isHydrated) {
      if (settings.customPrompt) {
        setPromptText(settings.customPrompt.content);
        setIsEnabled(settings.customPrompt.enabled);
      } else {
        // カスタムプロンプトが存在しない場合はデフォルトを設定
        setPromptText(defaultCustomPrompt.content);
        setIsEnabled(defaultCustomPrompt.enabled);
        updateCustomPrompt(defaultCustomPrompt);
      }
    }
  }, [isHydrated, settings.customPrompt, updateCustomPrompt]);

  // 安全にカスタムプロンプト設定を取得
  const customPrompt = settings.customPrompt || defaultCustomPrompt;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateCustomPrompt({
        content: promptText,
        enabled: isEnabled,
      });

      // 保存後の確認を複数回実行
      setTimeout(() => {
        const storedData = localStorage.getItem("ai-settings");

        if (storedData) {
          try {
            JSON.parse(storedData);
          } catch {}
        }
      }, 100);

      // さらに1秒後にも確認
      setTimeout(() => {
        localStorage.getItem("ai-settings");
      }, 1000);

      // 保存成功の視覚的フィードバック
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPrompt = `あなたは親しみやすく、知識豊富なAIアシスタントです。ユーザーの質問に対して丁寧で分かりやすい回答を心がけてください。`;
    setPromptText(defaultPrompt);
  };

  const hasChanges =
    promptText !== customPrompt.content || isEnabled !== customPrompt.enabled;

  return (
    <div className="space-y-4">
      {/* カスタムプロンプト設定 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white mb-1">
                カスタムプロンプト設定
              </h4>
              <p className="text-sm text-gray-400">
                AIの応答スタイルや性格をカスタマイズできます
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                有効
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                プロンプト内容
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                disabled={!isEnabled}
                placeholder="AIへの指示を入力してください..."
                className={`w-full h-32 px-4 py-3 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  !isEnabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {promptText.length} 文字 | 最終更新:{" "}
                {customPrompt.lastUpdated.toLocaleString("ja-JP")}
                {promptText.length > 1000 && (
                  <span className="text-yellow-400 ml-2">
                    ⚠️ 1000文字を超えています（推奨: 500文字以下）
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "保存中..." : "設定を保存"}
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="cursor-pointer bg-gray-900/50 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                デフォルトに戻す
              </Button>

              {/* 開発環境でのみデバッグボタンを表示 */}
              {/* {process.env.NODE_ENV === "development" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // ローカルストレージの内容をパースして表示
                      const stored = localStorage.getItem("ai-settings");
                      if (stored) {
                        try {
                          JSON.parse(stored);
                        } catch {}
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-700/20"
                  >
                    デバッグ情報
                  </Button>

                  <Button
                    onClick={() => {
                      if (confirm("ローカルストレージをクリアしますか？")) {
                        // すべてのai-settings関連のキーをクリア
                        Object.keys(localStorage).forEach((key) => {
                          if (
                            key.includes("ai-settings") ||
                            key.includes("ai-store")
                          ) {
                            localStorage.removeItem(key);
                          }
                        });
                        window.location.reload();
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-300 hover:bg-red-700/20"
                  >
                    ストレージクリア
                  </Button>
                </div>
              )} */}

              {hasChanges && (
                <p className="text-sm text-yellow-400">
                  未保存の変更があります
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Separator className="bg-gray-700" />

      {/* AI チャット設定 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <h4 className="text-lg font-semibold text-white">
          AI チャット・API設定
        </h4>
        <p className="text-sm text-gray-400">
          Google Gemini APIの設定とチャット機能
        </p>
        <EmotionChat />
      </Card>
    </div>
  );
}
