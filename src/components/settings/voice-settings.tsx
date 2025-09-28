"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useVoiceSettingsStore, type VoiceEngine } from "@/lib/stores/voice-settings-store";
import { voicevoxService } from "@/lib/services/voicevox-service";
import {
  integratedSpeechService,
  type EngineStatus,
} from "@/lib/services/integrated-speech-service";
import type { VoicevoxSpeaker } from "@/lib/types/voicevox";

export function VoiceSettings() {
  const {
    settings,
    updateEngine,
    updateVoicevoxConfig,
    updateWebSpeechConfig,
    updateGeneralSettings,
    resetToDefaults,
    setLoading,
    setError,
    isLoading,
    error,
  } = useVoiceSettingsStore();

  // 状態管理
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [voicevoxSpeakers, setVoicevoxSpeakers] = useState<VoicevoxSpeaker[]>([]);
  const [webSpeechVoices, setWebSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingSynthesis, setIsTestingSynthesis] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);

  /**
   * VOICEVOX話者読み込み
   */
  const loadVoicevoxSpeakers = useCallback(
    async (showErrors = true) => {
      try {
        const speakers = await integratedSpeechService.getVoicevoxSpeakers();
        setVoicevoxSpeakers(speakers);

        // 話者一覧読み込み成功時の処理
        if (showErrors) {
          setError(null); // エラーをクリア
          setConnectionTestResult("VOICEVOX話者一覧を正常に読み込みました。");
        }

        // デフォルト話者の自動選択
        const currentSpeaker = settings.voicevox.speaker;
        const isCurrentSpeakerValid = speakers.some((speaker) =>
          speaker.styles.some((style) => style.id === currentSpeaker),
        );

        if (!isCurrentSpeakerValid && speakers.length > 0) {
          // 現在の話者が無効な場合、最初の話者を選択
          const firstSpeaker = speakers[0];
          const firstStyle = firstSpeaker.styles[0];
          if (firstStyle) {
            updateVoicevoxConfig({ speaker: firstStyle.id });
            if (showErrors) {
              setConnectionTestResult(
                `VOICEVOX話者一覧を読み込み、デフォルト話者「${firstSpeaker.name} (${firstStyle.name})」を選択しました。`,
              );
            }
          }
        }

        return true;
      } catch (error) {
        setVoicevoxSpeakers([]);

        if (showErrors) {
          // APIキー関連のエラーの場合は詳細を表示
          if (error instanceof Error) {
            if (error.message.includes("APIキー")) {
              setConnectionTestResult(`設定エラー: ${error.message}`);
            } else if (
              error.message.includes("CORS") ||
              error.message.includes("Failed to fetch")
            ) {
              setConnectionTestResult(
                "VOICEVOX Web APIへの接続に失敗しました。APIキーを確認してください。",
              );
            } else {
              setConnectionTestResult(`VOICEVOX話者一覧の取得に失敗: ${error.message}`);
            }
          } else {
            setConnectionTestResult("VOICEVOX話者一覧の取得に失敗しました。");
          }
        }
        return false;
      }
    },
    [setError, settings.voicevox.speaker, updateVoicevoxConfig],
  );

  /**
   * 初期データ読み込み
   */
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // エンジン状態テスト
      await testEngineStatus();

      // Web Speech API音声読み込み
      await loadWebSpeechVoices();

      // VOICEVOX設定チェック - APIキーが設定されている場合は自動読み込み
      if (settings.engine === "voicevox" && settings.voicevox.useWebApi) {
        const apiKey = settings.voicevox.apiKey;
        if (apiKey && apiKey.trim()) {
          // APIキーが設定されている場合は自動的に話者一覧を読み込む
          try {
            await loadVoicevoxSpeakers(false); // エラー表示は抑制
          } catch (error) {
            // 初期化時のエラーは警告程度に留める
            console.warn("初期化時の話者読み込みに失敗:", error);
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "初期化に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setError,
    settings.engine,
    settings.voicevox.useWebApi,
    settings.voicevox.apiKey,
    loadVoicevoxSpeakers,
  ]);

  // 初期化
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 設定変更時の自動話者読み込み
  useEffect(() => {
    // VOICEVOXエンジンが選択され、Web APIが有効で、APIキーが設定されている場合
    if (
      settings.engine === "voicevox" &&
      settings.voicevox.useWebApi &&
      settings.voicevox.apiKey &&
      settings.voicevox.apiKey.trim() &&
      voicevoxSpeakers.length === 0 // 話者一覧がまだ読み込まれていない場合
    ) {
      // 自動的に話者一覧を読み込む
      loadVoicevoxSpeakers(false).catch((error) => {
        console.warn("設定変更時の話者読み込みに失敗:", error);
      });
    }
  }, [
    settings.engine,
    settings.voicevox.useWebApi,
    settings.voicevox.apiKey,
    voicevoxSpeakers.length,
    loadVoicevoxSpeakers,
  ]);

  /**
   * エンジン状態テスト
   */
  const testEngineStatus = async () => {
    try {
      const status = await integratedSpeechService.testEngineAvailability();
      setEngineStatus(status);
      return status;
    } catch {
      return null;
    }
  };

  /**
   * Web Speech API音声読み込み
   */
  const loadWebSpeechVoices = async () => {
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setWebSpeechVoices(voices);

        // 音声が非同期で読み込まれる場合があるため
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            const newVoices = window.speechSynthesis.getVoices();
            setWebSpeechVoices(newVoices);
          };
        }
      }
    } catch {}
  };

  /**
   * VOICEVOX設定を反映（話者一覧読み込み）
   */
  const handleApplyVoicevoxSettings = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // 話者リストを読み込み
      const success = await loadVoicevoxSpeakers(true);

      if (success) {
        // エンジン状態を更新
        await testEngineStatus();
      }
    } catch (error) {
      setConnectionTestResult(
        `設定反映エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * VOICEVOX接続テスト
   */
  const handleConnectionTest = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    setError(null); // エラーをクリア

    try {
      const result = await voicevoxService.testConnection();

      if (result.success) {
        setConnectionTestResult("接続成功！VOICEVOXサーバーが正常に動作しています。");
        // 話者リストを再読み込み
        await loadVoicevoxSpeakers();
        // エンジン状態を更新
        await testEngineStatus();
      } else {
        const errorMsg = result.error || "不明なエラー";
        setConnectionTestResult(`接続失敗: ${errorMsg}`);

        // APIキー関連のエラーかチェック
        if (errorMsg.includes("APIキー") || errorMsg.includes("invalidApiKey")) {
          setError("APIキーが無効です。正しいAPIキーを設定してください。");
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "不明なエラー";
      setConnectionTestResult(`接続エラー: ${errorMsg}`);

      // APIキー関連のエラーかチェック
      if (errorMsg.includes("APIキー")) {
        setError(`VOICEVOX設定エラー: ${errorMsg}`);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * 音声合成テスト
   */
  const handleSynthesisTest = async () => {
    setIsTestingSynthesis(true);

    try {
      // 音声合成前に設定を同期
      integratedSpeechService.syncSettings();

      const testText = "こんにちは、音声合成のテストです。";
      const success = await integratedSpeechService.speak(testText);

      if (success) {
        // 現在の話者情報を含むメッセージを表示
        if (settings.engine === "voicevox") {
          const currentSpeaker = voicevoxSpeakers.find((speaker) =>
            speaker.styles.some((style) => style.id === settings.voicevox.speaker),
          );
          const currentStyle = currentSpeaker?.styles.find(
            (style) => style.id === settings.voicevox.speaker,
          );

          if (currentSpeaker && currentStyle) {
            setConnectionTestResult(
              `音声合成テスト成功！話者: ${currentSpeaker.name} (${currentStyle.name})`,
            );
          } else {
            setConnectionTestResult("音声合成テスト成功！");
          }
        } else {
          setConnectionTestResult("音声合成テスト成功！");
        }
      } else {
        setConnectionTestResult("音声合成テストに失敗しました。話者設定を確認してください。");
      }
    } catch (error) {
      setConnectionTestResult(
        `音声合成エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    } finally {
      setIsTestingSynthesis(false);
    }
  };

  /**
   * 設定リセット
   */
  const handleResetSettings = () => {
    resetToDefaults();
    setConnectionTestResult("設定をリセットしました。");
  };

  /**
   * 音声エンジン変更
   */
  const handleEngineChange = (engine: VoiceEngine) => {
    updateEngine(engine);
    setConnectionTestResult(null);
  };

  /**
   * VOICEVOX話者変更
   */
  const handleVoicevoxSpeakerChange = (speakerId: string) => {
    const speakerIdNum = parseInt(speakerId, 10);
    updateVoicevoxConfig({ speaker: speakerIdNum });

    // 選択された話者の情報を表示
    const selectedSpeaker = voicevoxSpeakers.find((speaker) =>
      speaker.styles.some((style) => style.id === speakerIdNum),
    );
    const selectedStyle = selectedSpeaker?.styles.find((style) => style.id === speakerIdNum);

    if (selectedSpeaker && selectedStyle) {
      setConnectionTestResult(
        `話者を「${selectedSpeaker.name} (${selectedStyle.name})」に変更しました。`,
      );
    }
  };

  /**
   * Web Speech API音声変更
   */
  const handleWebSpeechVoiceChange = (voiceIndex: string) => {
    const voice = webSpeechVoices[parseInt(voiceIndex, 10)];
    updateWebSpeechConfig({ voice });
  };

  /**
   * エンジンステータスのバッジ
   */
  const getEngineStatusBadge = (available: boolean, error?: string) => {
    if (available) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          利用可能
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600" title={error}>
          <AlertCircle className="w-3 h-3 mr-1" />
          利用不可
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-gray-400" />
        <span className="text-gray-300">音声設定を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* エラー表示 */}
      {error && (
        <Card className="border-red-500 bg-red-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center text-red-300">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 音声エンジン選択 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Volume2 className="w-5 h-5 mr-2" />
            音声エンジン選択
          </CardTitle>
          <CardDescription className="text-gray-400">
            使用する音声合成エンジンを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Web Speech API */}
            <div className="border border-gray-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="engine-webspeech"
                    name="engine"
                    checked={settings.engine === "webspeech"}
                    onChange={() => handleEngineChange("webspeech")}
                    className="mr-2"
                  />
                  <label htmlFor="engine-webspeech" className="font-medium text-white">
                    Web Speech API
                  </label>
                </div>
                {engineStatus &&
                  getEngineStatusBadge(
                    engineStatus.webspeech.available,
                    engineStatus.webspeech.error,
                  )}
              </div>
              <p className="text-sm text-gray-400">ブラウザ標準の音声合成（機械的な音声）</p>
            </div>

            {/* VOICEVOX */}
            <div className="border border-gray-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="engine-voicevox"
                    name="engine"
                    checked={settings.engine === "voicevox"}
                    onChange={() => handleEngineChange("voicevox")}
                    className="mr-2"
                  />
                  <label htmlFor="engine-voicevox" className="font-medium text-white">
                    VOICEVOX
                  </label>
                </div>
                {engineStatus &&
                  getEngineStatusBadge(
                    engineStatus.voicevox.available,
                    engineStatus.voicevox.error,
                  )}
              </div>
              <p className="text-sm text-gray-400">高品質な日本語音声合成（Web API対応）</p>
              {engineStatus &&
                !settings.voicevox.useWebApi &&
                !engineStatus.voicevox.serverRunning && (
                  <p className="text-xs text-amber-600">⚠️ VOICEVOXサーバーが起動していません</p>
                )}
              {engineStatus && settings.voicevox.useWebApi && !engineStatus.voicevox.available && (
                <p className="text-xs text-amber-600">⚠️ APIキーが設定されていません</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Web Speech API設定 */}
      {settings.engine === "webspeech" && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Web Speech API 設定</CardTitle>
            <CardDescription className="text-gray-400">ブラウザ標準音声の詳細設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 音声選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">音声</label>
              <Select
                value={
                  settings.webspeech.voice && webSpeechVoices.length > 0
                    ? webSpeechVoices
                        .findIndex((v) => v.name === settings.webspeech.voice?.name)
                        .toString()
                    : ""
                }
                onValueChange={handleWebSpeechVoiceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="音声を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {webSpeechVoices.map((voice, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {voice.name} ({voice.lang}){voice.default && " [デフォルト]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 音声パラメータ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  速度: {settings.webspeech.rate.toFixed(1)}
                </label>
                <Slider
                  value={[settings.webspeech.rate]}
                  onValueChange={([value]) => updateWebSpeechConfig({ rate: value })}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  ピッチ: {settings.webspeech.pitch.toFixed(1)}
                </label>
                <Slider
                  value={[settings.webspeech.pitch]}
                  onValueChange={([value]) => updateWebSpeechConfig({ pitch: value })}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  音量: {settings.webspeech.volume.toFixed(1)}
                </label>
                <Slider
                  value={[settings.webspeech.volume]}
                  onValueChange={([value]) => updateWebSpeechConfig({ volume: value })}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VOICEVOX設定 */}
      {settings.engine === "voicevox" && (
        <Card className="bg-gray-900/50 border-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">VOICEVOX 設定</CardTitle>
            <CardDescription className="text-gray-400">VOICEVOX音声合成の詳細設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API種別選択 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">API種別</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Web API */}
                <div className="border border-gray-600 rounded-lg p-3 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="voicevox-web-api"
                      name="voicevox-api"
                      checked={settings.voicevox.useWebApi}
                      onChange={() =>
                        updateVoicevoxConfig({
                          useWebApi: true,
                          serverUrl: "https://deprecatedapis.tts.quest/v2/voicevox",
                        })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="voicevox-web-api" className="font-medium text-white">
                      Web API
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">アプリ不要、即座に利用可能</p>
                </div>

                {/* ローカルAPI */}
                <div className="border border-gray-600 rounded-lg p-3 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="voicevox-local-api"
                      name="voicevox-api"
                      checked={!settings.voicevox.useWebApi}
                      onChange={() =>
                        updateVoicevoxConfig({
                          useWebApi: false,
                          serverUrl: "http://localhost:50021",
                        })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="voicevox-local-api" className="font-medium text-white">
                      ローカルAPI
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">VOICEVOXアプリが必要</p>
                </div>
              </div>
            </div>

            {/* APIキー設定（Web API使用時のみ） */}
            {settings.voicevox.useWebApi && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">APIキー</label>
                <input
                  type="password"
                  value={settings.voicevox.apiKey ?? ""}
                  onChange={(e) => updateVoicevoxConfig({ apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="APIキーを入力してください"
                />
                <div className="text-xs text-gray-400 space-y-1">
                  <p>VOICEVOX Web APIの利用にはAPIキーが必要です</p>
                  <p>
                    APIキーの取得方法:
                    <a
                      href="https://voicevox.su-shiki.com/su-shikiapis/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline ml-1"
                    >
                      こちらから取得
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* サーバー接続設定 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">サーバーURL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={settings.voicevox.serverUrl ?? ""}
                  onChange={(e) => updateVoicevoxConfig({ serverUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder={
                    settings.voicevox.useWebApi
                      ? "https://deprecatedapis.tts.quest/v2/voicevox"
                      : "http://localhost:50021"
                  }
                  disabled={settings.voicevox.useWebApi}
                />
                <Button
                  onClick={handleConnectionTest}
                  disabled={
                    isTestingConnection ||
                    (settings.voicevox.useWebApi && !(settings.voicevox.apiKey ?? "").trim())
                  }
                  variant="outline"
                  className="border-blue-600/90 cursor-pointer text-white bg-blue-600/90 hover:text-white hover:bg-blue-800/90"
                >
                  {isTestingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  テスト
                </Button>
              </div>
              {settings.voicevox.useWebApi && (
                <p className="text-xs text-gray-400">Web API使用時はURL変更できません</p>
              )}
              {settings.voicevox.useWebApi && !(settings.voicevox.apiKey ?? "").trim() && (
                <p className="text-xs text-amber-400">⚠️ APIキーが設定されていません</p>
              )}
            </div>

            {/* 話者選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">話者</label>
              {voicevoxSpeakers.length > 0 ? (
                <div className="space-y-2">
                  <Select
                    value={settings.voicevox.speaker.toString()}
                    onValueChange={handleVoicevoxSpeakerChange}
                  >
                    <SelectTrigger className="text-white">
                      <SelectValue placeholder="話者を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {voicevoxSpeakers.map((speaker) =>
                        speaker.styles.map((style) => (
                          <SelectItem key={style.id} value={style.id.toString()}>
                            {speaker.name} ({style.name})
                          </SelectItem>
                        )),
                      )}
                    </SelectContent>
                  </Select>

                  {/* 現在選択されている話者の情報を表示 */}
                  {(() => {
                    const currentSpeaker = voicevoxSpeakers.find((speaker) =>
                      speaker.styles.some((style) => style.id === settings.voicevox.speaker),
                    );
                    const currentStyle = currentSpeaker?.styles.find(
                      (style) => style.id === settings.voicevox.speaker,
                    );

                    if (currentSpeaker && currentStyle) {
                      return (
                        <div className="flex items-center space-x-2 text-xs">
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            選択中
                          </Badge>
                          <span className="text-gray-300">
                            {currentSpeaker.name} ({currentStyle.name})
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="space-y-2">
                  <Select disabled>
                    <SelectTrigger className="opacity-50">
                      <SelectValue placeholder="話者一覧を読み込んでください" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-amber-400">
                    ⚠️ 上記の「設定を反映」ボタンを押して話者一覧を読み込んでください
                  </p>
                </div>
              )}
            </div>

            {/* タイムアウト設定 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                タイムアウト: {(settings.voicevox.timeout / 1000).toFixed(1)}秒
              </label>
              <Slider
                value={[settings.voicevox.timeout]}
                onValueChange={([value]) => updateVoicevoxConfig({ timeout: value })}
                min={5000}
                max={30000}
                step={1000}
              />
            </div>

            {/* 設定反映ボタン */}
            <div className="pt-12">
              <Button
                onClick={handleApplyVoicevoxSettings}
                disabled={
                  isTestingConnection ||
                  (settings.voicevox.useWebApi && !(settings.voicevox.apiKey ?? "").trim())
                }
                className="w-full cursor-pointer bg-blue-600/90 hover:bg-blue-800/90"
                variant="default"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    設定を反映中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    設定を反映
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-400 mt-1 text-center">
                APIキーや設定を変更した後、このボタンで話者一覧を読み込みます
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 共通設定 */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Settings className="w-5 h-5 mr-2" />
            共通設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoFallback"
              checked={settings.autoFallback}
              onChange={(e) => updateGeneralSettings({ autoFallback: e.target.checked })}
            />
            <label htmlFor="autoFallback" className="text-sm text-white">
              自動フォールバック（VOICEVOXエラー時にWeb Speech APIに切り替え）
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showVoiceCredits"
              checked={settings.showVoiceCredits}
              onChange={(e) => updateGeneralSettings({ showVoiceCredits: e.target.checked })}
            />
            <label htmlFor="showVoiceCredits" className="text-sm text-white">
              音声クレジット表示（コンソールにVOICEVOX話者名を表示）
            </label>
          </div>
        </CardContent>
      </Card>

      {/* テスト・操作ボタン */}
      <Card className="bg-gray-900/50 border-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">テスト・操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSynthesisTest}
              disabled={isTestingSynthesis}
              variant="outline"
              className="cursor-pointer bg-gray-900/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {isTestingSynthesis ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Volume2 className="w-4 h-4 mr-2" />
              )}
              音声テスト
            </Button>

            <Button
              onClick={() => integratedSpeechService.clearVoicevoxCache()}
              variant="outline"
              className="cursor-pointer bg-gray-900/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              キャッシュクリア
            </Button>

            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="cursor-pointer bg-gray-900/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              設定リセット
            </Button>
          </div>

          {/* テスト結果表示 */}
          {connectionTestResult && (
            <div
              className={`p-1 rounded-md text-sm ${
                connectionTestResult.includes("正常") ? "text-green-500" : "text-red-500"
              }`}
            >
              {connectionTestResult}
            </div>
          )}

          {/* キャッシュ情報 */}
          <div className="text-xs text-gray-400">
            音声キャッシュ: {integratedSpeechService.getVoicevoxCacheInfo().size} /{" "}
            {integratedSpeechService.getVoicevoxCacheInfo().maxSize} 件
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-gray-700" />

      {/* 注意事項（ローカルAPI使用時のみ） */}
      {settings.engine === "voicevox" && !settings.voicevox.useWebApi && (
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-300 space-y-2">
              <p className="font-medium">📝 VOICEVOX ローカルAPI使用時の注意事項：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>VOICEVOXアプリケーションを事前に起動してください</li>
                <li>デフォルトポート（50021）で起動していることを確認してください</li>
                <li>初回使用時は話者データのダウンロードが必要な場合があります</li>
                <li>音声合成にはインターネット接続は不要です（ローカル処理）</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web API使用時の注意事項 */}
      {settings.engine === "voicevox" && settings.voicevox.useWebApi && (
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="pt-4">
            <div className="text-sm text-green-300 space-y-2">
              <p className="font-medium">✨ VOICEVOX Web API使用時の利点：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>VOICEVOXアプリケーションのインストール不要</li>
                <li>即座に高品質な日本語音声合成が利用可能</li>
                <li>APIキーを設定するだけで簡単に開始</li>
                <li>クラウドベースで常に最新の音声エンジン</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
