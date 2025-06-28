"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Settings, RefreshCw } from "lucide-react";
import { useVoiceSettingsStore } from "@/lib/stores/voice-settings-store";
import { integratedSpeechService } from "@/lib/services/integrated-speech-service";
import type { VoicevoxSpeaker } from "@/lib/types/voicevox";

interface VoiceSpeakerSelectorProps {
  className?: string;
  onSettingsClick?: () => void;
}

export function VoiceSpeakerSelector({ 
  className = "", 
  onSettingsClick 
}: VoiceSpeakerSelectorProps) {
  const {
    settings,
    updateVoicevoxConfig,
  } = useVoiceSettingsStore();

  // 状態管理
  const [speakers, setSpeakers] = useState<VoicevoxSpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 話者一覧を読み込み
   */
  const loadSpeakers = useCallback(async (showError = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const speakerList = await integratedSpeechService.getVoicevoxSpeakers();
      setSpeakers(speakerList);
      return true;
    } catch (error) {
      console.error("話者一覧読み込みエラー:", error);
      setSpeakers([]);
      
      if (showError) {
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        if (errorMessage.includes("APIキー")) {
          setError("APIキーが必要です");
        } else {
          setError("話者一覧の取得に失敗");
        }
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 初期化時に話者一覧を読み込み（エラーは非表示）
   */
  useEffect(() => {
    if (settings.engine === "voicevox" && settings.voicevox.apiKey) {
      loadSpeakers(false);
    }
  }, [settings.engine, settings.voicevox.apiKey, loadSpeakers]);

  /**
   * 話者変更ハンドラー
   */
  const handleSpeakerChange = (speakerId: string) => {
    const newSpeakerId = parseInt(speakerId, 10);
    updateVoicevoxConfig({ speaker: newSpeakerId });
  };

  /**
   * 手動リロード
   */
  const handleReload = () => {
    loadSpeakers(true);
  };

  /**
   * 現在の話者名を取得
   */
  const getCurrentSpeakerName = () => {
    if (speakers.length === 0) return "未設定";
    
    for (const speaker of speakers) {
      for (const style of speaker.styles) {
        if (style.id === settings.voicevox.speaker) {
          return `${speaker.name} (${style.name})`;
        }
      }
    }
    return `話者ID: ${settings.voicevox.speaker}`;
  };

  // VOICEVOXエンジンが選択されていない場合は表示しない
  if (settings.engine !== "voicevox") {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 現在の話者表示 */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
        <User className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-800 min-w-0">
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              読み込み中...
            </span>
          ) : error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span className="truncate max-w-[120px]">
              {getCurrentSpeakerName()}
            </span>
          )}
        </span>
      </div>

      {/* 話者選択ドロップダウン */}
      {speakers.length > 0 && !error && (
        <Select
          value={settings.voicevox.speaker.toString()}
          onValueChange={handleSpeakerChange}
        >
          <SelectTrigger className="w-[200px] bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <SelectValue placeholder="話者を選択" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {speakers.map((speaker) =>
              speaker.styles.map((style) => (
                <SelectItem key={style.id} value={style.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{speaker.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {style.name}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* アクションボタン */}
      <div className="flex gap-1">
        {/* リロードボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReload}
          disabled={isLoading}
          className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/95"
          title="話者一覧を再読み込み"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>

        {/* 設定ボタン */}
        {onSettingsClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSettingsClick}
            className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/95"
            title="音声設定を開く"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 