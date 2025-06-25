"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Loader2, Volume2, VolumeX, Settings, RefreshCw } from "lucide-react";
import { useVoiceSettingsStore, type VoiceEngine } from "@/lib/stores/voice-settings-store";
import { voicevoxService } from "@/lib/services/voicevox-service";
import { integratedSpeechService, type EngineStatus } from "@/lib/services/integrated-speech-service";
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
  const loadVoicevoxSpeakers = useCallback(async () => {
    try {
      const speakers = await integratedSpeechService.getVoicevoxSpeakers();
      setVoicevoxSpeakers(speakers);
      setError(null); // エラーをクリア
    } catch (error) {
      console.error("VOICEVOX話者読み込みエラー:", error);
      setVoicevoxSpeakers([]);
      
      // APIキー関連のエラーの場合は詳細を表示
      if (error instanceof Error) {
        if (error.message.includes("APIキー")) {
          setError(`VOICEVOX設定エラー: ${error.message}`);
        } else if (error.message.includes("CORS") || error.message.includes("Failed to fetch")) {
          setError("VOICEVOX Web APIへの接続に失敗しました。APIキーを確認してください。");
        } else {
          setError(`VOICEVOX話者一覧の取得に失敗: ${error.message}`);
        }
      } else {
        setError("VOICEVOX話者一覧の取得に失敗しました。");
      }
    }
  }, [setError]);

  /**
   * 初期データ読み込み
   */
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // エンジン状態テスト
      const status = await testEngineStatus();
      
      // Web Speech API音声読み込み
      await loadWebSpeechVoices();
      
      // VOICEVOX話者読み込み（サーバーが利用可能な場合のみ）
      if (status?.voicevox.serverRunning) {
        await loadVoicevoxSpeakers();
      }
    } catch (error) {
      console.error("初期データ読み込みエラー:", error);
      setError(error instanceof Error ? error.message : "初期化に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, loadVoicevoxSpeakers]);

  // 初期化
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /**
   * エンジン状態テスト
   */
  const testEngineStatus = async () => {
    try {
      const status = await integratedSpeechService.testEngineAvailability();
      setEngineStatus(status);
      return status;
    } catch (error) {
      console.error("エンジン状態テストエラー:", error);
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
    } catch (error) {
      console.error("Web Speech API音声読み込みエラー:", error);
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
      const testText = "こんにちは、音声合成のテストです。";
      const success = await integratedSpeechService.speak(testText);
      
      if (success) {
        setConnectionTestResult("音声合成テスト成功！");
      } else {
        setConnectionTestResult("音声合成テストに失敗しました。");
      }
    } catch (error) {
      setConnectionTestResult(`音声合成エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
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
    updateVoicevoxConfig({ speaker: parseInt(speakerId, 10) });
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
      return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />利用可能</Badge>;
    } else {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600" title={error}>
          <AlertCircle className="w-3 h-3 mr-1" />利用不可
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>音声設定を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 音声エンジン選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            音声エンジン選択
          </CardTitle>
          <CardDescription>
            使用する音声合成エンジンを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Web Speech API */}
            <div className="border rounded-lg p-4 space-y-3">
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
                  <label htmlFor="engine-webspeech" className="font-medium">
                    Web Speech API
                  </label>
                </div>
                {engineStatus && getEngineStatusBadge(engineStatus.webspeech.available, engineStatus.webspeech.error)}
              </div>
              <p className="text-sm text-gray-600">
                ブラウザ標準の音声合成（機械的な音声）
              </p>
            </div>

            {/* VOICEVOX */}
            <div className="border rounded-lg p-4 space-y-3">
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
                  <label htmlFor="engine-voicevox" className="font-medium">
                    VOICEVOX
                  </label>
                </div>
                {engineStatus && getEngineStatusBadge(engineStatus.voicevox.available, engineStatus.voicevox.error)}
              </div>
              <p className="text-sm text-gray-600">
                高品質な日本語音声合成（Web API対応）
              </p>
              {engineStatus && !settings.voicevox.useWebApi && !engineStatus.voicevox.serverRunning && (
                <p className="text-xs text-amber-600">
                  ⚠️ VOICEVOXサーバーが起動していません
                </p>
              )}
              {engineStatus && settings.voicevox.useWebApi && !engineStatus.voicevox.available && (
                <p className="text-xs text-amber-600">
                  ⚠️ APIキーが設定されていません
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Web Speech API設定 */}
      {settings.engine === "webspeech" && (
        <Card>
          <CardHeader>
            <CardTitle>Web Speech API 設定</CardTitle>
            <CardDescription>
              ブラウザ標準音声の詳細設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 音声選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">音声</label>
              <Select
                value={settings.webspeech.voice && webSpeechVoices.length > 0 
                  ? webSpeechVoices.findIndex(v => v.name === settings.webspeech.voice?.name).toString() 
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
                      {voice.name} ({voice.lang})
                      {voice.default && " [デフォルト]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 音声パラメータ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
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
                <label className="text-sm font-medium">
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
                <label className="text-sm font-medium">
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
        <Card>
          <CardHeader>
            <CardTitle>VOICEVOX 設定</CardTitle>
            <CardDescription>
              VOICEVOX音声合成の詳細設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API種別選択 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">API種別</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Web API */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="voicevox-web-api"
                      name="voicevox-api"
                      checked={settings.voicevox.useWebApi}
                      onChange={() => updateVoicevoxConfig({ 
                        useWebApi: true,
                        serverUrl: "https://deprecatedapis.tts.quest/v2/voicevox"
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="voicevox-web-api" className="font-medium">
                      Web API
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    アプリ不要、即座に利用可能
                  </p>
                </div>

                {/* ローカルAPI */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="voicevox-local-api"
                      name="voicevox-api"
                      checked={!settings.voicevox.useWebApi}
                      onChange={() => updateVoicevoxConfig({ 
                        useWebApi: false,
                        serverUrl: "http://localhost:50021"
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="voicevox-local-api" className="font-medium">
                      ローカルAPI
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    VOICEVOXアプリが必要
                  </p>
                </div>
              </div>
            </div>

            {/* APIキー設定（Web API使用時のみ） */}
            {settings.voicevox.useWebApi && (
              <div className="space-y-2">
                <label className="text-sm font-medium">APIキー</label>
                <input
                  type="password"
                  value={settings.voicevox.apiKey ?? ""}
                  onChange={(e) => updateVoicevoxConfig({ apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="APIキーを入力してください"
                />
                                 <div className="text-xs text-gray-600 space-y-1">
                   <p>VOICEVOX Web APIの利用にはAPIキーが必要です</p>
                   <p>
                     APIキーの取得方法:
                     <a 
                       href="https://voicevox.su-shiki.com/su-shikiapis/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800 underline ml-1"
                     >
                       こちらから取得
                     </a>
                   </p>
                   <div className="mt-2 p-2 bg-blue-50 rounded border text-xs">
                     <p className="font-medium text-blue-800">取得手順:</p>
                     <ol className="list-decimal list-inside text-blue-700 space-y-1 mt-1">
                       <li>上記リンクを開く</li>
                       <li>STEP1の「こちら」をクリック</li>
                       <li>「私はロボットではありません」にチェック</li>
                       <li>「apiKeyを生成」をクリック</li>
                       <li>表示されたAPIKeyをコピーして設定</li>
                     </ol>
                   </div>
                 </div>
              </div>
            )}

            {/* サーバー接続設定 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">サーバーURL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={settings.voicevox.serverUrl ?? ""}
                  onChange={(e) => updateVoicevoxConfig({ serverUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder={settings.voicevox.useWebApi ? "https://deprecatedapis.tts.quest/v2/voicevox" : "http://localhost:50021"}
                  disabled={settings.voicevox.useWebApi}
                />
                <Button
                  onClick={handleConnectionTest}
                  disabled={isTestingConnection || (settings.voicevox.useWebApi && !(settings.voicevox.apiKey ?? "").trim())}
                  variant="outline"
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
                <p className="text-xs text-gray-600">
                  Web API使用時はURL変更できません
                </p>
              )}
              {settings.voicevox.useWebApi && !(settings.voicevox.apiKey ?? "").trim() && (
                <p className="text-xs text-amber-600">
                  ⚠️ APIキーが設定されていません
                </p>
              )}
            </div>

            {/* 話者選択 */}
            {voicevoxSpeakers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">話者</label>
                <Select
                  value={settings.voicevox.speaker.toString()}
                  onValueChange={handleVoicevoxSpeakerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="話者を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicevoxSpeakers.map((speaker) =>
                      speaker.styles.map((style) => (
                        <SelectItem key={style.id} value={style.id.toString()}>
                          {speaker.name} ({style.name})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* タイムアウト設定 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
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
          </CardContent>
        </Card>
      )}

      {/* 共通設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
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
            <label htmlFor="autoFallback" className="text-sm">
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
            <label htmlFor="showVoiceCredits" className="text-sm">
              音声クレジット表示（コンソールにVOICEVOX話者名を表示）
            </label>
          </div>
        </CardContent>
      </Card>

      {/* テスト・操作ボタン */}
      <Card>
        <CardHeader>
          <CardTitle>テスト・操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSynthesisTest}
              disabled={isTestingSynthesis}
              variant="outline"
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
            >
              <VolumeX className="w-4 h-4 mr-2" />
              キャッシュクリア
            </Button>
            
            <Button
              onClick={handleResetSettings}
              variant="outline"
            >
              設定リセット
            </Button>
          </div>

          {/* テスト結果表示 */}
          {connectionTestResult && (
            <div className={`p-3 rounded-md text-sm ${
              connectionTestResult.includes("成功") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {connectionTestResult}
            </div>
          )}

          {/* キャッシュ情報 */}
          <div className="text-xs text-gray-500">
            音声キャッシュ: {integratedSpeechService.getVoicevoxCacheInfo().size} / {integratedSpeechService.getVoicevoxCacheInfo().maxSize} 件
          </div>
        </CardContent>
      </Card>

      <Separator />
      
      {/* 注意事項（ローカルAPI使用時のみ） */}
      {settings.engine === "voicevox" && !settings.voicevox.useWebApi && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-700 space-y-2">
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
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="text-sm text-green-700 space-y-2">
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