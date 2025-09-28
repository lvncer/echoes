/**
 * 音声チャットオーケストレーター
 * 音声入力 → AI応答 → 音声出力の統合フローを管理
 * 旧AudioChatIntegrationServiceから責務を分離
 */

import { AudioInputService } from "./audio-input";
import { SpeechRecognitionService } from "./speech-recognition";
import { IntegratedSpeechService } from "./integrated-speech-service";
import { AnimationController } from "./animation-controller";
import { errorHandler } from "./error-handler";
import type { AudioConfig, SpeechRecognitionResult } from "@/types/audio";

export interface AudioChatConfig {
  audioInput: Partial<AudioConfig>;
  speechRecognition: {
    language: string;
    continuous: boolean;
    interimResults: boolean;
  };
  speechSynthesis: {
    voice?: SpeechSynthesisVoice;
    rate: number;
    pitch: number;
    volume: number;
  };
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
  onStatusChange?: (status: AudioChatStatus) => void;
}

export type AudioChatStatus = "idle" | "listening" | "processing" | "speaking" | "error";

export class AudioChatOrchestrator {
  private config: AudioChatConfig;
  private callbacks: AudioChatCallbacks;
  private status: AudioChatStatus = "idle";
  private isActive = false;

  constructor(
    private audioInput: AudioInputService,
    private speechRecognition: SpeechRecognitionService,
    private speechSynthesis: IntegratedSpeechService,
    private animationController: AnimationController,
    config: AudioChatConfig,
    callbacks: AudioChatCallbacks = {},
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.setupEventHandlers();
    this.updateServiceConfigs();
  }

  private setupEventHandlers(): void {
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
        errorHandler.handleAudioError("SPEECH_RECOGNITION_FAILED", error);
        this.setStatus("error");
      },
    });

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
        errorHandler.handleAudioError("SPEECH_SYNTHESIS_FAILED", error);
        this.setStatus("error");
      },
    });
  }

  private updateServiceConfigs(): void {
    this.speechRecognition.updateConfig({
      language: this.config.speechRecognition.language,
      continuous: this.config.speechRecognition.continuous,
      interimResults: this.config.speechRecognition.interimResults,
      maxAlternatives: 1,
    });
  }

  public async startAudioChat(): Promise<boolean> {
    try {
      if (this.isActive) {
        return true;
      }

      const hasPermission = await this.audioInput.requestMicrophoneAccess(this.config.audioInput);

      if (!hasPermission) {
        errorHandler.handleAudioError("PERMISSION_DENIED", "マイクアクセスが拒否されました");
        return false;
      }

      this.speechSynthesis.syncSettings();
      this.isActive = true;
      this.setStatus("idle");
      return true;
    } catch (error) {
      errorHandler.handleAudioError(
        "INITIALIZATION_FAILED",
        `音声チャット初期化に失敗しました: ${error}`,
      );
      return false;
    }
  }

  public stopAudioChat(): void {
    if (!this.isActive) return;

    this.speechRecognition.stop();
    this.speechSynthesis.stop();
    this.audioInput.stopRecording();

    this.isActive = false;
    this.setStatus("idle");
  }

  public startListening(): boolean {
    if (!this.isActive || this.status !== "idle") {
      return false;
    }
    return this.speechRecognition.start();
  }

  public stopListening(): void {
    if (this.status === "listening") {
      this.speechRecognition.stop();
    }
  }

  private async handleFinalTranscript(transcript: string): Promise<void> {
    try {
      this.setStatus("processing");

      if (typeof window !== "undefined") {
        const { useAIStore } = await import("../stores/ai-store");
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
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });
      }

      this.setStatus("idle");
    } catch (error) {
      errorHandler.handleAIError("AI_RESPONSE_FAILED", `AI応答の取得に失敗しました: ${error}`);
      this.setStatus("idle");
    }
  }

  private async speakResponse(text: string): Promise<void> {
    try {
      if (!text || text.trim().length === 0) {
        return;
      }

      await this.speechSynthesis.syncSettings();

      if (this.animationController) {
        this.animationController.analyzeAndPlayEmotionAnimation(text);
      }

      await this.speechSynthesis.speak(text);
    } catch (error) {
      errorHandler.handleAudioError("SPEECH_SYNTHESIS_FAILED", `音声合成に失敗しました: ${error}`);
    }
  }

  private setStatus(newStatus: AudioChatStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.callbacks.onStatusChange?.(newStatus);
    }
  }

  public getStatus(): AudioChatStatus {
    return this.status;
  }

  public isAudioChatActive(): boolean {
    return this.isActive;
  }

  public updateConfig(newConfig: Partial<AudioChatConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateServiceConfigs();
  }
}
