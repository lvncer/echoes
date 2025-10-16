"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, KeyRound, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useVoiceSettingsStore } from "@/lib/stores/voice-settings-store";
import { useAIStore } from "@/lib/stores/ai-store";
import { integratedSpeechService } from "@/lib/services/integrated-speech-service";
import { voicevoxService } from "@/lib/services/voicevox-service";
import { VOICEVOX_WEB_API_CONFIG } from "@/types/voicevox";

interface InlineEnvInputsProps {
  className?: string;
}

type Status = "idle" | "testing" | "ok" | "error";

export function InlineEnvInputs({ className = "" }: InlineEnvInputsProps) {
  // VOICEVOX
  const { settings: voiceSettings, updateVoicevoxConfig } = useVoiceSettingsStore();
  const [voicevoxKey, setVoicevoxKey] = useState<string>(voiceSettings.voicevox.apiKey ?? "");
  const [voiceStatus, setVoiceStatus] = useState<Status>("idle");
  const [showVoiceKey, setShowVoiceKey] = useState(false);

  // AI（現在のプロバイダー）
  const { settings: aiSettings, updateProviderConfig } = useAIStore();
  const currentProvider = aiSettings.currentProvider.provider;
  const currentAIConfig = aiSettings.providers[currentProvider];
  const [aiKey, setAIKey] = useState<string>(currentAIConfig.apiKey ?? "");
  const [aiStatus, setAIStatus] = useState<Status>("idle");
  const [showAIKey, setShowAIKey] = useState(false);

  // ストア変更に同期（他画面で更新された場合に追従）
  useEffect(() => {
    setVoicevoxKey(voiceSettings.voicevox.apiKey ?? "");
  }, [voiceSettings.voicevox.apiKey]);

  useEffect(() => {
    const cfg = useAIStore.getState().settings;
    const provider = cfg.currentProvider.provider;
    setAIKey(cfg.providers[provider].apiKey ?? "");
  }, [aiSettings.currentProvider.provider, aiSettings.providers]);

  const canApplyVoice = useMemo(
    () => voicevoxKey.trim().length > 0 && voiceStatus !== "testing",
    [voicevoxKey, voiceStatus],
  );
  const canApplyAI = useMemo(
    () => aiKey.trim().length > 0 && aiStatus !== "testing",
    [aiKey, aiStatus],
  );

  const applyVoicevox = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voicevoxKey.trim()) return;

    setVoiceStatus("testing");
    try {
      // ストア更新（Web API前提でURLも整える）
      updateVoicevoxConfig({
        apiKey: voicevoxKey.trim(),
        useWebApi: true,
        serverUrl: VOICEVOX_WEB_API_CONFIG.serverUrl,
      });

      // サービスに反映
      integratedSpeechService.syncSettings();
      voicevoxService.updateConfig(useVoiceSettingsStore.getState().settings.voicevox);

      // 実接続テスト（サーバ情報取得まで確認）
      const result = await voicevoxService.testConnection();
      setVoiceStatus(result.success ? "ok" : "error");
    } catch {
      setVoiceStatus("error");
    }
  };

  const applyAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiKey.trim()) return;

    setAIStatus("testing");
    try {
      // 現在プロバイダーへ反映
      updateProviderConfig(currentProvider, { apiKey: aiKey.trim() });

      // 接続テスト（/api/chat 経由）
      const ok = await useAIStore.getState().testConnection();
      setAIStatus(ok ? "ok" : "error");
    } catch {
      setAIStatus("error");
    }
  };

  const statusButtonClass = (status: Status) => {
    switch (status) {
      case "ok":
        return "border-green-400/60 hover:bg-green-600/90";
      case "error":
        return "border-red-400/60 hover:bg-red-600/90";
      case "testing":
        return "border-yellow-400/60 hover:bg-yellow-600/90";
      default:
        return "border-gray-600/50 hover:bg-gray-700/90";
    }
  };

  const renderStatusIcon = (status: Status) => {
    if (status === "testing") return <Loader2 className="w-5 h-5 text-white animate-spin" />;
    if (status === "ok") return <Check className="w-5 h-5 text-white" />;
    if (status === "error") return <ShieldAlert className="w-5 h-5 text-white" />;
    return <KeyRound className="w-5 h-5 text-white" />;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* VOICEVOX API Key */}
      <form onSubmit={applyVoicevox} className="flex items-center gap-2">
        <div className="relative">
          <input
            type={showVoiceKey ? "text" : "password"}
            value={voicevoxKey}
            onChange={(e) => setVoicevoxKey(e.target.value)}
            placeholder="VOICEVOX Key"
            disabled={voiceStatus === "testing"}
            className="w-44 h-10 px-4 pr-10 bg-gray-800/90 backdrop-blur-xl border-2 border-gray-600/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            type="button"
            aria-label="toggle-voicevox-visibility"
            onClick={() => setShowVoiceKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
          >
            {showVoiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          type="submit"
          variant="outline"
          size="icon"
          disabled={!canApplyVoice}
          className={`w-10 h-10 rounded-full bg-gray-800/90 ${statusButtonClass(
            voiceStatus,
          )} border-2 shadow-lg disabled:opacity-50 flex items-center justify-center`}
          title={voiceStatus === "ok" ? "適用済み" : voiceStatus === "error" ? "エラー" : "適用"}
        >
          {renderStatusIcon(voiceStatus)}
        </Button>
      </form>

      {/* AI Provider API Key */}
      <form onSubmit={applyAI} className="flex items-center gap-2">
        <div className="relative">
          <input
            type={showAIKey ? "text" : "password"}
            value={aiKey}
            onChange={(e) => setAIKey(e.target.value)}
            placeholder={`${currentProvider.toUpperCase()} Key`}
            disabled={aiStatus === "testing"}
            className="w-44 h-10 px-4 pr-10 bg-gray-800/90 backdrop-blur-xl border-2 border-gray-600/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            type="button"
            aria-label="toggle-ai-visibility"
            onClick={() => setShowAIKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
          >
            {showAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          type="submit"
          variant="outline"
          size="icon"
          disabled={!canApplyAI}
          className={`w-10 h-10 rounded-full bg-gray-800/90 ${statusButtonClass(
            aiStatus,
          )} border-2 shadow-lg disabled:opacity-50 flex items-center justify-center`}
          title={aiStatus === "ok" ? "適用済み" : aiStatus === "error" ? "エラー" : "適用"}
        >
          {renderStatusIcon(aiStatus)}
        </Button>
      </form>
    </div>
  );
}
