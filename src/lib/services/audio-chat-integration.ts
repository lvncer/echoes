/**
 * 音声処理とAIチャット機能の統合サービス
 * 音声入力 → AI応答 → 音声出力の完全なフローを管理
 */

import { AudioInputService } from "./audio-input";
import { SpeechRecognitionService } from "./speech-recognition";
import { SpeechSynthesisService } from "./speech-synthesis";
import { integratedLipSyncService } from "./integrated-lipsync-service";
import type {
  AudioConfig,
  AudioError,
  SpeechRecognitionResult,
} from "../types/audio";

export interface AudioChatConfig {
  // 音声入力設定
  audioInput: Partial<AudioConfig>;
  // 音声認識設定
  speechRecognition: {
    language: string;
    continuous: boolean;
    interimResults: boolean;
  };
  // 音声合成設定
  speechSynthesis: {
    voice?: SpeechSynthesisVoice;
    rate: number;
    pitch: number;
    volume: number;
  };
  // AI応答設定
  aiResponse: {
    provider: "openai" | "gemini";
    model: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AudioChatCallbacks {
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  onTranscriptReceived?: (transcript: string, isFinal: boolean) => void;
  onAIResponseReceived?: (response: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: AudioError) => void;
  onStatusChange?: (status: AudioChatStatus) => void;
}

export type AudioChatStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export class AudioChatIntegrationService {
  private audioInput: AudioInputService;
  private speechRecognition: SpeechRecognitionService;
  private speechSynthesis: SpeechSynthesisService;
  private config: AudioChatConfig;
  private callbacks: AudioChatCallbacks;
  private status: AudioChatStatus = "idle";
  private isActive = false;
  private lastStatusLogTime = 0;

  // リップシンク連動制御
  private isLipSyncEnabled = true;
  private currentMicStream: MediaStream | null = null;

  constructor(config: AudioChatConfig, callbacks: AudioChatCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // サービス初期化（引数なしで初期化）
    this.audioInput = new AudioInputService();
    this.speechRecognition = new SpeechRecognitionService();
    this.speechSynthesis = new SpeechSynthesisService();

    this.setupEventHandlers();
    this.updateServiceConfigs();
  }

  /**
   * サービス設定を更新
   */
  private updateServiceConfigs(): void {
    // 音声認識設定を更新
    this.speechRecognition.updateConfig({
      language: this.config.speechRecognition.language,
      continuous: this.config.speechRecognition.continuous,
      interimResults: this.config.speechRecognition.interimResults,
      maxAlternatives: 1,
    });

    // 音声合成設定を更新
    this.speechSynthesis.updateConfig({
      voice: this.config.speechSynthesis.voice,
      rate: this.config.speechSynthesis.rate,
      pitch: this.config.speechSynthesis.pitch,
      volume: this.config.speechSynthesis.volume,
      language: this.config.speechRecognition.language,
    });
  }

  /**
   * イベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    // 音声認識イベント
    this.speechRecognition.setEventListeners({
      onResult: (result: SpeechRecognitionResult) => {
        this.callbacks.onTranscriptReceived?.(
          result.transcript,
          result.isFinal
        );

        if (result.isFinal && result.transcript.trim()) {
          this.handleFinalTranscript(result.transcript);
        }
      },
      onSpeechStart: () => {
        this.setStatus("listening");
        this.callbacks.onListeningStart?.();
      },
      onSpeechEnd: () => {
        if (this.status === "listening") {
          this.setStatus("idle");
          this.callbacks.onListeningEnd?.();
        }
      },
      onError: (error: string) => {
        this.handleError({
          type: "speech-recognition-failed",
          message: error,
        });
      },
    });

    // 音声合成イベント
    this.speechSynthesis.setEventListeners({
      onSpeechStart: () => {
        this.setStatus("speaking");
        this.callbacks.onSpeechStart?.();
      },
      onSpeechEnd: () => {
        this.setStatus("idle");
        this.callbacks.onSpeechEnd?.();
      },
      onError: (error: string) => {
        this.handleError({
          type: "speech-synthesis-failed",
          message: error,
        });
      },
    });
  }

  /**
   * 音声チャット開始
   */
  public async startAudioChat(): Promise<boolean> {
    try {
      if (this.isActive) {
        console.warn("音声チャットは既に開始されています");
        return true;
      }

      // 環境診断を実行
      await this.performEnvironmentCheck();

      // マイクアクセス許可を取得
      const hasPermission = await this.audioInput.requestMicrophoneAccess(
        this.config.audioInput
      );
      if (!hasPermission) {
        this.handleError({
          type: "permission-denied",
          message: "マイクアクセスが拒否されました",
        });
        return false;
      }

      // マイクストリームを取得
      this.currentMicStream = await this.getMicrophoneStream();

      this.isActive = true;
      this.setStatus("idle");

      console.log("🎤 音声チャット開始 - リップシンク準備完了");
      return true;
    } catch (error) {
      this.handleError({
        type: "initialization-failed",
        message: `音声チャット初期化に失敗しました: ${error}`,
      });
      return false;
    }
  }

  /**
   * 環境診断を実行
   */
  private async performEnvironmentCheck(): Promise<void> {
    console.log("🔍 環境診断開始");

    // ブラウザ機能サポート確認
    const hasGetUserMedia =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasSpeechRecognition =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    const hasSpeechSynthesis = "speechSynthesis" in window;
    const hasAudioContext =
      "AudioContext" in window || "webkitAudioContext" in window;

    console.log("🌐 ブラウザサポート状況:", {
      getUserMedia: hasGetUserMedia,
      speechRecognition: hasSpeechRecognition,
      speechSynthesis: hasSpeechSynthesis,
      audioContext: hasAudioContext,
      userAgent: navigator.userAgent,
    });

    // 利用可能な音声デバイス確認
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      console.log(
        "🎙️ 利用可能な音声入力デバイス:",
        audioInputs.map((device) => ({
          deviceId: device.deviceId,
          label: device.label || "未知のデバイス",
          kind: device.kind,
        }))
      );
    } catch (error) {
      console.warn("⚠️ デバイス列挙エラー:", error);
    }

    // リップシンク機能確認
    if (this.isLipSyncEnabled) {
      console.log("🧪 リップシンク機能テスト実行中...");
      const testResult = await integratedLipSyncService.testLipSync();
      console.log(`💋 リップシンク機能: ${testResult ? "正常" : "異常"}`);
    }

    console.log("✅ 環境診断完了");
  }

  /**
   * 音声チャット停止
   */
  public stopAudioChat(): void {
    if (!this.isActive) return;

    this.speechRecognition.stop();
    this.speechSynthesis.stop();
    this.audioInput.stopRecording();

    // リップシンクを停止
    if (this.isLipSyncEnabled) {
      integratedLipSyncService.stopLipSync();
    }

    // マイクストリームを停止
    if (this.currentMicStream) {
      this.currentMicStream.getTracks().forEach((track) => track.stop());
      this.currentMicStream = null;
    }

    this.isActive = false;
    this.setStatus("idle");
    console.log("🎤 音声チャット停止 - リップシンク停止");
  }

  /**
   * 音声認識開始（リップシンクも同時開始）
   */
  public startListening(): boolean {
    if (!this.isActive) {
      console.warn("音声チャットが開始されていません");
      return false;
    }

    try {
      // 音声認識を開始
      this.speechRecognition.start();

      // リップシンク機能が有効な場合、マイクストリームを使用してリップシンクを開始
      if (this.isLipSyncEnabled) {
        console.log("🎤 音声認識開始 - リップシンク連携開始");
        if (this.currentMicStream) {
          console.log("🔄 既存ストリームでリップシンク開始");
          // 既存のストリームを使用
          integratedLipSyncService
            .startMicrophoneLipSync(this.currentMicStream)
            .then(() => {
              console.log("✅ マイク入力リップシンク開始（既存ストリーム）");
            })
            .catch((error) => {
              console.warn("❌ マイク入力リップシンク開始エラー:", error);
              // エラーの場合は新しいストリームを取得してリトライ
              this.retryLipSyncWithNewStream();
            });
        } else {
          console.log("🔄 新規ストリーム取得でリップシンク開始");
          // ストリームが無い場合は新しく取得
          this.retryLipSyncWithNewStream();
        }
      } else {
        console.log("⚠️ リップシンク機能が無効です");
      }

      return true;
    } catch (error) {
      console.error("音声認識開始エラー:", error);
      return false;
    }
  }

  /**
   * 新しいマイクストリームでリップシンクをリトライ
   */
  private async retryLipSyncWithNewStream(): Promise<void> {
    try {
      console.log("🔄 新しいマイクストリームでリップシンクを再試行");
      const newStream = await this.getMicrophoneStream();
      this.currentMicStream = newStream;

      await integratedLipSyncService.startMicrophoneLipSync(newStream);
      console.log("🎤 マイク入力リップシンク開始（新規ストリーム）");
    } catch (error) {
      console.error("新しいストリームでのリップシンク開始エラー:", error);
    }
  }

  /**
   * 音声認識停止（リップシンクも停止）
   */
  public stopListening(): void {
    this.speechRecognition.stop();

    // マイク入力リップシンクを停止（TTS用は維持）
    if (this.isLipSyncEnabled) {
      integratedLipSyncService.stopMicrophoneLipSync();
      console.log("🎤 マイク入力リップシンク停止");
    }
  }

  /**
   * 最終的な音声認識結果の処理
   */
  private async handleFinalTranscript(transcript: string): Promise<void> {
    try {
      console.log(`📝 音声認識完了: "${transcript}"`);
      this.setStatus("processing");

      // AI応答を取得
      const aiResponse = await this.getAIResponse(transcript);
      console.log(`🤖 AI応答取得完了: "${aiResponse.substring(0, 50)}..."`);

      this.callbacks.onAIResponseReceived?.(aiResponse);

      // 音声合成で応答を再生
      await this.speakResponse(aiResponse);

      // 確実にアイドル状態に戻す
      this.setStatus("idle");
    } catch (error) {
      console.error("❌ AI応答処理エラー:", error);
      this.handleError({
        type: "ai-response-failed",
        message: `AI応答の取得に失敗しました: ${error}`,
      });
      // エラー時も確実にアイドル状態に戻す
      this.setStatus("idle");
    }
  }

  /**
   * AI応答の取得
   */
  private async getAIResponse(userMessage: string): Promise<string> {
    // 既存のchat APIエンドポイントと互換性のある形式でリクエスト
    const messages = [
      {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        timestamp: new Date(),
      },
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `AI API エラー: ${response.status} - ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    // APIレスポンスから適切にメッセージを取得
    if (data.message && data.message.content) {
      return data.message.content;
    }

    // フォールバック
    return data.response || "申し訳ありませんが、応答を生成できませんでした。";
  }

  /**
   * AI応答の音声合成
   */
  private async speakResponse(text: string): Promise<void> {
    try {
      this.setStatus("speaking");

      // アニメーション制御サービスで感情解析とアニメーション実行
      if (typeof window !== "undefined") {
        const windowWithController = window as typeof window & {
          __animationController?: {
            analyzeAndPlayEmotionAnimation: (text: string) => void;
          };
        };
        if (windowWithController.__animationController) {
          windowWithController.__animationController.analyzeAndPlayEmotionAnimation(
            text
          );
        }
      }

      // 統合リップシンクサービスで音声合成とリップシンクを統合処理
      await integratedLipSyncService.startAIResponseLipSync(text);

      // 音声合成の完了を監視
      await this.waitForSpeechCompletion(text);
    } catch (error) {
      console.error("❌ AI応答音声合成エラー:", error);
      this.handleError({
        type: "speech-synthesis-failed",
        message: `音声合成に失敗しました: ${error}`,
      });
    }
  }

  /**
   * 音声合成の完了を待機
   */
  private waitForSpeechCompletion(text: string): Promise<void> {
    return new Promise((resolve) => {
      // タイムアウト設定（より余裕を持った設定に変更）
      const estimatedDuration = Math.max(15000, text.length * 300); // 最低15秒、文字数×300ms
      console.log(
        `🕐 音声合成完了監視開始: 推定時間 ${Math.round(
          estimatedDuration / 1000
        )}秒 (テキスト長: ${text.length}文字)`
      );

      const timeout = setTimeout(() => {
        console.log("⏰ 音声合成タイムアウト - 正常終了");
        this.setStatus("idle");
        resolve();
      }, estimatedDuration);

      let checkCount = 0;
      const maxChecks = Math.floor(estimatedDuration / 500); // チェック間隔を500msに延長
      let consecutiveStoppedChecks = 0; // 連続して停止状態と判定された回数
      const requiredStoppedChecks = 3; // 停止判定に必要な連続回数

      // 音声合成の完了を監視
      const checkCompletion = () => {
        checkCount++;
        const lipSyncStatus = integratedLipSyncService.getStatus();
        const isSpeaking = this.speechSynthesis.isSpeaking();
        const isStandardSpeaking =
          "speechSynthesis" in window ? window.speechSynthesis.speaking : false;

        // 複数の音声合成状態をチェック
        const isAnySpeaking =
          lipSyncStatus.isTTSSpeaking || isSpeaking || isStandardSpeaking;

        if (!isAnySpeaking) {
          consecutiveStoppedChecks++;
          console.log(
            `🔍 音声停止チェック ${consecutiveStoppedChecks}/${requiredStoppedChecks} (${checkCount}/${maxChecks})`
          );

          // 連続して停止状態が検出された場合のみ完了とみなす
          if (consecutiveStoppedChecks >= requiredStoppedChecks) {
            console.log("✅ 音声合成完了確認 - 正常終了");
            clearTimeout(timeout);
            this.setStatus("idle");
            resolve();
            return;
          }
        } else {
          // 音声が検出された場合はカウンターをリセット
          if (consecutiveStoppedChecks > 0) {
            console.log(
              `🎤 音声検出 - 停止カウンターリセット (${consecutiveStoppedChecks} → 0)`
            );
          }
          consecutiveStoppedChecks = 0;
        }

        if (checkCount >= maxChecks) {
          // 最大チェック回数に達した
          console.log("⏰ 最大チェック回数到達 - 強制終了");
          clearTimeout(timeout);
          this.setStatus("idle");
          resolve();
        } else {
          // まだ話している場合は500ms後に再チェック
          setTimeout(checkCompletion, 500);
        }
      };

      // 少し遅延してからチェック開始（音声合成の開始を待つ）
      setTimeout(checkCompletion, 2000); // 開始待機時間も2秒に延長
    });
  }

  /**
   * ステータス変更
   */
  private setStatus(newStatus: AudioChatStatus): void {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      console.log(`音声チャット状態変更: ${oldStatus} → ${newStatus}`);
      this.callbacks.onStatusChange?.(newStatus);
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: AudioError): void {
    this.setStatus("error");
    this.callbacks.onError?.(error);
    console.error("AudioChatIntegration エラー:", error);
  }

  /**
   * 設定更新
   */
  public updateConfig(newConfig: Partial<AudioChatConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 各サービスの設定も更新
    if (newConfig.speechRecognition) {
      this.speechRecognition.updateConfig({
        language: newConfig.speechRecognition.language,
        continuous: newConfig.speechRecognition.continuous,
        interimResults: newConfig.speechRecognition.interimResults,
        maxAlternatives: 1,
      });
    }
    if (newConfig.speechSynthesis) {
      this.speechSynthesis.updateConfig({
        voice: newConfig.speechSynthesis.voice,
        rate: newConfig.speechSynthesis.rate,
        pitch: newConfig.speechSynthesis.pitch,
        volume: newConfig.speechSynthesis.volume,
        language: this.config.speechRecognition.language,
      });
    }
  }

  /**
   * 現在のステータス取得
   */
  public getStatus(): AudioChatStatus {
    return this.status;
  }

  /**
   * アクティブ状態確認
   */
  public isAudioChatActive(): boolean {
    return this.isActive;
  }

  /**
   * 利用可能な音声一覧取得
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis.getAvailableVoices();
  }

  /**
   * 日本語音声一覧取得
   */
  public getJapaneseVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis.getJapaneseVoices();
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.stopAudioChat();
    this.audioInput.cleanup();
    this.speechRecognition.cleanup();
    this.speechSynthesis.cleanup();
  }

  /**
   * マイクストリームを取得
   */
  private async getMicrophoneStream(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...this.config.audioInput,
        },
      });
    } catch (error) {
      console.error("マイクストリーム取得エラー:", error);
      throw error;
    }
  }

  /**
   * リップシンク機能の有効/無効を設定
   */
  public setLipSyncEnabled(enabled: boolean): void {
    this.isLipSyncEnabled = enabled;
    console.log(`🎤 リップシンク機能: ${enabled ? "有効" : "無効"}`);
  }

  /**
   * リップシンク機能の状態を取得
   */
  public isLipSyncFunctionEnabled(): boolean {
    return this.isLipSyncEnabled;
  }
}
