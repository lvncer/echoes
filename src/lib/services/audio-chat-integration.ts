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

      this.isActive = true;
      this.setStatus("idle");
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
   * 音声チャット停止
   */
  public stopAudioChat(): void {
    if (!this.isActive) return;

    this.speechRecognition.stop();
    this.speechSynthesis.stop();
    this.audioInput.stopRecording();

    this.isActive = false;
    this.setStatus("idle");
  }

  /**
   * 音声入力開始（プッシュトゥトーク）
   */
  public startListening(): boolean {
    if (!this.isActive || this.status !== "idle") {
      return false;
    }

    return this.speechRecognition.start();
  }

  /**
   * 音声入力停止
   */
  public stopListening(): void {
    if (this.status === "listening") {
      this.speechRecognition.stop();
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
      console.log("🤖 AI応答取得開始");
      const aiResponse = await this.getAIResponse(transcript);
      console.log(`🤖 AI応答取得完了: "${aiResponse.substring(0, 50)}..."`);
      this.callbacks.onAIResponseReceived?.(aiResponse);

      // 音声合成で応答を再生
      console.log("🔊 音声合成開始");
      await this.speakResponse(aiResponse);
      console.log("🔊 音声合成完了 - 処理終了");

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
      console.log(`🎭 AI応答アニメーション連動開始: "${text.substring(0, 50)}..."`);

      // アニメーション制御サービスで感情解析とアニメーション実行
      if (typeof window !== "undefined") {
        const windowWithController = window as typeof window & {
          __animationController?: {
            analyzeAndPlayEmotionAnimation: (text: string) => void;
          };
        };
        if (windowWithController.__animationController) {
          console.log("🎭 アニメーションコントローラー発見 - 感情解析実行");
          windowWithController.__animationController.analyzeAndPlayEmotionAnimation(
            text
          );
          console.log("🎭 感情解析・アニメーション実行完了");
        } else {
          console.warn("⚠️ アニメーションコントローラーが見つかりません");
        }
      } else {
        console.warn("⚠️ ブラウザ環境ではありません - アニメーション連動スキップ");
      }

      // 統合リップシンクサービスでAI応答リップシンクを開始
      console.log("🔊 統合リップシンクサービス開始");
      await integratedLipSyncService.startAIResponseLipSync(text);

      // 音声合成の完了を監視するためのPromiseを作成
      console.log("🔊 音声合成完了待機開始");
      await this.waitForSpeechCompletion(text);
      console.log("🔊 音声合成完了");
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
      console.log(`音声合成完了待機開始: "${text.substring(0, 30)}..."`);

      // タイムアウト設定（テキストの長さに基づいて動的に設定）
      const estimatedDuration = Math.max(5000, text.length * 150); // 最低5秒、文字数×150ms
      console.log(`推定音声時間: ${estimatedDuration}ms`);

      const timeout = setTimeout(() => {
        console.warn("⚠️ 音声合成のタイムアウト - 強制的に完了とみなします");
        this.setStatus("idle"); // 強制的にアイドル状態に戻す
        resolve();
      }, estimatedDuration);

      let checkCount = 0;
      const maxChecks = Math.floor(estimatedDuration / 100); // 最大チェック回数

      // 音声合成の完了を監視
      const checkCompletion = () => {
        checkCount++;
        const status = integratedLipSyncService.getStatus();
        const isSpeaking = this.speechSynthesis.isSpeaking();

        // 詳細ログ（最初の5回と最後の5回、その後は10回に1回）
        if (
          checkCount <= 5 ||
          checkCount >= maxChecks - 5 ||
          checkCount % 10 === 0
        ) {
          console.log(
            `🔍 音声状態チェック[${checkCount}/${maxChecks}]: TTS=${status.isTTSSpeaking}, Speech=${isSpeaking}, Status=${this.status}`
          );
        }

        if (!status.isTTSSpeaking && !isSpeaking) {
          // 音声合成が完了した
          clearTimeout(timeout);
          console.log("✅ 音声合成完了を検知 - アイドル状態に移行");
          this.setStatus("idle");
          resolve();
        } else if (checkCount >= maxChecks) {
          // 最大チェック回数に達した
          clearTimeout(timeout);
          console.warn("⚠️ 最大チェック回数に達しました - 強制完了");
          this.setStatus("idle");
          resolve();
        } else {
          // まだ話している場合は100ms後に再チェック
          setTimeout(checkCompletion, 100);
        }
      };

      // 少し遅延してからチェック開始（音声合成の開始を待つ）
      setTimeout(checkCompletion, 500);
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
}
