/**
 * 音声処理とAIチャット機能の統合サービス
 * 音声入力 → AI応答 → 音声出力の完全なフローを管理
 */

import { AudioInputService } from "./audio-input";
import { SpeechRecognitionService } from "./speech-recognition";
import { IntegratedSpeechService } from "./integrated-speech-service";
import { integratedLipSyncService } from "./integrated-lipsync-service";
import { AnimationController } from "./animation-controller";
import type { AudioConfig, AudioError, SpeechRecognitionResult } from "@/types/audio";
import { useAIStore } from "@/lib/stores/ai-store";
import { useChatHistoryStore } from "@/lib/stores/chat-history-store";
import type { ChatMessage } from "@/types/ai";

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

export type AudioChatStatus = "idle" | "listening" | "processing" | "speaking" | "error";

export class AudioChatIntegrationService {
  private audioInput: AudioInputService;
  private speechRecognition: SpeechRecognitionService;
  private speechSynthesis: IntegratedSpeechService;
  private config: AudioChatConfig;
  private callbacks: AudioChatCallbacks;
  private status: AudioChatStatus = "idle";
  private isActive = false;
  private lastStatusLogTime = 0;
  private animationController: AnimationController | null = null;

  constructor(config: AudioChatConfig, callbacks: AudioChatCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // サービス初期化（引数なしで初期化）
    this.audioInput = new AudioInputService();
    this.speechRecognition = new SpeechRecognitionService();
    this.speechSynthesis = new IntegratedSpeechService();

    this.setupEventHandlers();
    this.updateServiceConfigs();
    this.setupAnimationController();

    // 初期化時に設定を同期して話者設定を確実に適用
    this.syncVoiceSettings();
  }

  /**
   * アニメーションコントローラーのセットアップ
   */
  private async setupAnimationController(): Promise<void> {
    // サービスコンテナからアニメーションコントローラーを取得
    try {
      const { serviceContainer } = await import("./service-container");
      this.animationController = serviceContainer.animationController;

      // 音声合成サービスにアニメーションコントローラーを設定
      if (this.animationController) {
        this.speechSynthesis.setAnimationController(this.animationController);
      }
    } catch (error) {
      console.warn("Failed to load animation controller from service container:", error);
    }
  }

  /**
   * 音声設定を同期
   */
  private syncVoiceSettings(): void {
    try {
      // 音声合成サービスの設定を強制的に同期
      this.speechSynthesis.syncSettings();
    } catch (error) {
      console.warn("[AudioChatIntegration] 音声設定の同期に失敗:", error);
    }
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

    // 音声合成設定を更新（統合サービス用）
    // Note: 統合音声サービスは設定ストアから設定を取得するため、
    // 直接的な設定更新は不要。必要に応じてストアを更新する。
  }

  /**
   * イベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    // 音声認識イベント
    this.speechRecognition.setEventListeners({
      onResult: (result: SpeechRecognitionResult) => {
        this.callbacks.onTranscriptReceived?.(result.transcript, result.isFinal);

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
      onSpeakStart: () => {
        this.setStatus("speaking");
        this.callbacks.onSpeechStart?.();
      },
      onSpeakEnd: () => {
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
        return true;
      }
      const hasPermission = await this.audioInput.requestMicrophoneAccess(this.config.audioInput);
      if (!hasPermission) {
        this.handleError({
          type: "permission-denied",
          message: "マイクアクセスが拒否されました",
        });
        return false;
      }

      // 音声チャット開始時に設定を同期
      this.syncVoiceSettings();

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
    integratedLipSyncService.stopLipSync();
    this.audioInput.stopRecording();

    // 話者設定を保持するため、設定をクリアしない
    // Note: 音声合成サービスの設定は保持される

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
      this.setStatus("processing");

      if (typeof window !== "undefined") {
        const { useAIStore } = await import("../stores/ai-store");
        // sendMessage前のメッセージ数を記録
        const prevLength = useAIStore.getState().messages.length;

        await new Promise<void>((resolve) => {
          useAIStore.getState().sendMessage(transcript, true);
          let checked = 0;
          const interval = setInterval(() => {
            const messages = useAIStore.getState().messages;
            const lastMessage = messages[messages.length - 1];
            if (messages.length > prevLength && lastMessage) {
              const isError =
                /申し訳ありません|エラー|失敗|error|not available|unavailable|could not|できません|ありません/i.test(
                  lastMessage.content,
                );
              if (
                lastMessage.role === "assistant" &&
                lastMessage.content &&
                lastMessage.content.trim().length > 0 &&
                !isError
              ) {
                this.callbacks.onAIResponseReceived?.(lastMessage.content);
                this.speakResponse(lastMessage.content);
                clearInterval(interval);
                resolve();
              }
            }
            checked += 1;
            if (checked > 100) {
              // 100回=10秒
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });
      }

      this.setStatus("idle");
    } catch (error) {
      this.handleError({
        type: "ai-response-failed",
        message: `AI応答の取得に失敗しました: ${error}`,
      });
      this.setStatus("idle");
    }
  }

  /**
   * AI応答の取得
   */
  private async getAIResponse(userMessage: string): Promise<string> {
    // ストアから設定を取得
    const { settings } = useAIStore.getState();
    const customPrompt = settings.customPrompt;
    const aiConfig = settings.currentProvider;

    // 既存のchat APIエンドポイントと互換性のある形式でリクエスト
    const messages = [
      {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        timestamp: new Date(),
      },
    ];

    const requestBody: {
      messages: typeof messages;
      customPrompt?: { enabled: boolean; content: string };
      aiConfig?: typeof aiConfig; // aiConfigを追加
    } = {
      messages,
      aiConfig, // aiConfigをリクエストに含める
    };

    // カスタムプロンプトが有効な場合は追加
    if (customPrompt?.enabled && customPrompt?.content?.trim()) {
      requestBody.customPrompt = customPrompt;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI API エラー: ${response.status} - ${errorData.error || "Unknown error"}`);
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
      if (!text || text.trim().length === 0) {
        return;
      }

      // 音声合成前に最新の設定を強制的に同期
      if (typeof window !== "undefined") {
        try {
          // IntegratedSpeechServiceの設定を強制的に同期
          await this.speechSynthesis.syncSettings();
        } catch (e) {
          console.warn("[デバッグ] useVoiceSettingsStoreの取得または設定同期に失敗", e);
        }
      }

      await integratedLipSyncService.startAIResponseLipSync(text);

      // アニメーション制御サービスで感情解析とアニメーション実行
      if (this.animationController) {
        this.animationController.analyzeAndPlayEmotionAnimation(text);
      }
    } catch (error) {
      console.error("[デバッグ] speakResponseでエラー発生", error);
      this.handleError({
        type: "speech-synthesis-failed",
        message: `音声合成に失敗しました: ${error}`,
      });
    }
  }

  /**
   * idle になるまで待機（タイムアウト付き）
   */
  private waitUntilIdle(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now();
      const loop = () => {
        const lip = integratedLipSyncService.getStatus();
        if (this.status === "idle" && !lip.isTTSSpeaking) {
          resolve();
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          this.setStatus("idle");
          resolve();
          return;
        }
        setTimeout(loop, 100);
      };
      setTimeout(loop, 100);
    });
  }

  /**
   * ステータス変更
   */
  private setStatus(newStatus: AudioChatStatus): void {
    if (this.status !== newStatus) {
      const _oldStatus = this.status;
      this.status = newStatus;
      this.callbacks.onStatusChange?.(newStatus);
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: AudioError): void {
    this.setStatus("error");
    this.callbacks.onError?.(error);
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
    // 音声合成設定は統合音声サービスで管理されるため、
    // 必要に応じて音声設定ストアを更新する
    // TODO: 音声設定ストアとの連携実装
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
   * 利用可能な音声一覧取得（Web Speech API用）
   */
  public async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    // Web Speech APIの音声一覧を取得
    // 統合音声サービスからWeb Speech部分の音声を取得
    if (typeof window !== "undefined" && window.speechSynthesis) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * 日本語音声一覧取得（Web Speech API用）
   */
  public async getJapaneseVoices(): Promise<SpeechSynthesisVoice[]> {
    const voices = await this.getAvailableVoices();
    return voices.filter((voice) => voice.lang.startsWith("ja"));
  }

  /**
   * VOICEVOX話者一覧取得
   */
  public async getVoicevoxSpeakers() {
    return await this.speechSynthesis.getVoicevoxSpeakers();
  }

  /**
   * テンプレートメッセージからAI応答を実行
   * テンプレートパネルから呼び出される
   */
  public async processTemplateMessage(message: string): Promise<boolean> {
    try {
      if (this.status === "error") {
        this.setStatus("idle");
      }
      if (this.status !== "idle") {
        await this.waitUntilIdle(10000);
      }

      const historyStore = useChatHistoryStore.getState();

      // ユーザーメッセージを履歴に追加
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
        isVoice: true,
      };
      historyStore.addMessage(userMessage);

      // 処理状態に変更
      this.setStatus("processing");

      // AI応答を取得
      const aiResponse = await this.getAIResponse(message);

      if (!aiResponse) {
        this.handleError({
          type: "ai-response-failed",
          message: "AI応答を取得できませんでした",
        });
        this.setStatus("idle");
        return false;
      }

      // AI応答を履歴に追加
      const aiMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        isVoice: true,
      };
      historyStore.addMessage(aiMessage);

      // コールバック実行
      this.callbacks.onAIResponseReceived?.(aiResponse);

      // 音声合成開始
      this.setStatus("speaking");
      await this.speakResponse(aiResponse);

      return true;
    } catch (error) {
      this.handleError({
        type: "template-message-failed",
        message: `テンプレートメッセージの処理に失敗しました: ${error}`,
      });
      this.setStatus("idle");
      return false;
    }
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.stopAudioChat();
    this.audioInput.cleanup();
    this.speechRecognition.cleanup();

    // 完全なクリーンアップ時のみ音声合成サービスをクリーンアップ
    // 通常の会話終了時は設定を保持
    this.speechSynthesis.cleanup();
    integratedLipSyncService.stopLipSync();
  }
}
