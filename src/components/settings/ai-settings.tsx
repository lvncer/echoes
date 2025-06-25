"use client";

import { useState, useEffect } from "react";
import { useAIStore } from "@/lib/stores/ai-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw } from "lucide-react";
import Chat from "../chat";

// カスタムプロンプト設定のデフォルト値を定義（コンポーネント外で定義）
const defaultCustomPrompt = {
  enabled: true,
  content: `あなたは親しみやすく、知識豊富なAIアシスタントです。
ユーザーの質問に対して丁寧で分かりやすい回答を心がけてください。
専門用語を使う場合は、簡単な説明も併せて提供してください。
会話は自然で親しみやすいトーンで行い、必要に応じて例を挙げて説明してください。`,
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
      console.log("🔧 [AI Settings Debug] Hydration完了、ストア状態:", settings);
    }, 100);

    return () => clearTimeout(timer);
  }, [settings]);

  // 復元完了後に設定を読み込み
  useEffect(() => {
    if (isHydrated) {
      console.log("🔧 [AI Settings Debug] 設定読み込み開始:", settings.customPrompt);
      
      if (settings.customPrompt) {
        setPromptText(settings.customPrompt.content);
        setIsEnabled(settings.customPrompt.enabled);
        console.log("🔧 [AI Settings Debug] 既存設定を適用:", {
          content: settings.customPrompt.content.substring(0, 50) + "...",
          enabled: settings.customPrompt.enabled,
          lastUpdated: settings.customPrompt.lastUpdated
        });
      } else {
        // カスタムプロンプトが存在しない場合はデフォルトを設定
        console.log("🔧 [AI Settings Debug] カスタムプロンプトが存在しないため、デフォルトを設定");
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
      // デバッグログ: 保存前の状態
      console.log("🔧 [AI Settings Debug] 保存前の状態:", {
        enabled: isEnabled,
        contentLength: promptText.length,
        content: promptText,
        timestamp: new Date().toISOString()
      });

      updateCustomPrompt({
        content: promptText,
        enabled: isEnabled,
      });

      // 保存後にローカルストレージの内容を確認
      setTimeout(() => {
        const storedData = localStorage.getItem("ai-settings");
        console.log("🔧 [AI Settings Debug] ローカルストレージの内容:", storedData);
        
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("🔧 [AI Settings Debug] パース済みデータ:", parsed);
          } catch (e) {
            console.error("🔧 [AI Settings Debug] JSONパースエラー:", e);
          }
        }
      }, 100);

      // 保存成功の視覚的フィードバック
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPrompt = `あなたは親しみやすく、知識豊富なAIアシスタントです。
ユーザーの質問に対して丁寧で分かりやすい回答を心がけてください。
専門用語を使う場合は、簡単な説明も併せて提供してください。
会話は自然で親しみやすいトーンで行い、必要に応じて例を挙げて説明してください。`;
    setPromptText(defaultPrompt);
  };

  const hasChanges = 
    promptText !== customPrompt.content || 
    isEnabled !== customPrompt.enabled;

  return (
    <div className="space-y-6">
      {/* カスタムプロンプト設定 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
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
                className={`w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {promptText.length} 文字 | 最終更新: {customPrompt.lastUpdated.toLocaleString('ja-JP')}
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
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "保存中..." : "設定を保存"}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                デフォルトに戻す
              </Button>

              {/* デバッグ用ボタン */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log("🔧 [Debug] 現在のストア状態:", useAIStore.getState().settings);
                    console.log("🔧 [Debug] ローカルストレージ:", localStorage.getItem("ai-settings"));
                    
                    // ローカルストレージの内容をパースして表示
                    const stored = localStorage.getItem("ai-settings");
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored);
                        console.log("🔧 [Debug] パース済みローカルストレージ:", parsed);
                      } catch (e) {
                        console.error("🔧 [Debug] JSONパースエラー:", e);
                      }
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
                      localStorage.removeItem("ai-settings");
                      console.log("🔧 [Debug] ローカルストレージをクリアしました");
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
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-1">
              AI チャット・API設定
            </h4>
            <p className="text-sm text-gray-400">
              Google Gemini APIの設定とチャット機能
            </p>
          </div>
          <Chat />
        </div>
      </Card>
    </div>
  );
} 