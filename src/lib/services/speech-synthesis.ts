import type {
  SpeechSynthesisConfig,
  AudioEvents,
  AudioProcessingState,
} from "@/lib/types/audio";
import {
  getLocalizedErrorMessage,
  detectBrowserSupport,
  getBrowserLimitations,
} from "@/lib/utils/audio-support";

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null;
  private isSupported = false;
  private events: Partial<AudioEvents> = {};
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private state: AudioProcessingState = {
    isRecording: false,
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    error: null,
  };

  private config: SpeechSynthesisConfig = {
    voice: undefined,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: "ja-JP",
  };

  constructor() {
    this.initialize();
  }

  /**
   * 音声合成を初期化
   */
  private initialize(): void {
    const support = detectBrowserSupport();
    this.isSupported = support.speechSynthesis;

    if (!this.isSupported) {
      this.handleError("not-supported");
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      this.setupVoiceChangeListener();
    }
  }

  /**
   * 利用可能な音声を読み込み
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    this.availableVoices = this.synthesis.getVoices();

    // 日本語音声を優先的に選択
    if (!this.config.voice && this.availableVoices.length > 0) {
      const japaneseVoice = this.availableVoices.find((voice) =>
        voice.lang.startsWith("ja")
      );
      this.config.voice = japaneseVoice || this.availableVoices[0];
    }
  }

  /**
   * 音声変更イベントリスナーを設定
   */
  private setupVoiceChangeListener(): void {
    if (!this.synthesis) return;

    // 音声リストが非同期で読み込まれる場合があるため
    this.synthesis.onvoiceschanged = () => {
      this.loadVoices();
    };
  }

  /**
   * イベントリスナーを設定
   */
  public setEventListeners(events: Partial<AudioEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<SpeechSynthesisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 利用可能な音声を取得
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.availableVoices];
  }

  /**
   * 日本語音声のみを取得
   */
  public getJapaneseVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((voice) => voice.lang.startsWith("ja"));
  }

  /**
   * テキストを音声で読み上げ
   */
  public speak(text: string): boolean {
    if (!this.isSupported || !this.synthesis) {
      this.handleError("not-supported");
      return false;
    }

    if (!text.trim()) {
      return false;
    }

    // 既に再生中の場合は停止
    if (this.state.isSpeaking) {
      this.stop();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      // 設定を適用
      if (this.config.voice) {
        utterance.voice = this.config.voice;
      }
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      utterance.lang = this.config.language;

      // イベントリスナーを設定
      utterance.onstart = () => {
        this.state.isSpeaking = true;
        this.clearError();
        this.events.onSpeechStart?.();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.currentUtterance = null;
        this.events.onSpeechEnd?.();
      };

      utterance.onerror = (event) => {
        this.state.isSpeaking = false;
        this.currentUtterance = null;
        this.handleSynthesisError(event);
      };

      utterance.onpause = () => {
        // 一時停止時の処理
      };

      utterance.onresume = () => {
        // 再開時の処理
      };

      this.currentUtterance = utterance;

      // ブラウザ制限の確認
      const limitations = getBrowserLimitations();
      if (limitations.requiresUserGesture) {
        // ユーザージェスチャーが必要な場合の処理
        // 実際の再生は後で行う
      }

      this.synthesis.speak(utterance);
      return true;
    } catch {
      this.handleError("audio-capture");
      return false;
    }
  }

  /**
   * 音声再生を停止
   */
  public stop(): void {
    if (this.synthesis && this.state.isSpeaking) {
      this.synthesis.cancel();
      this.state.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * 音声再生を一時停止
   */
  public pause(): void {
    if (this.synthesis && this.state.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * 音声再生を再開
   */
  public resume(): void {
    if (this.synthesis && this.state.isSpeaking) {
      this.synthesis.resume();
    }
  }

  /**
   * 再生中かどうかを確認
   */
  public isSpeaking(): boolean {
    return this.state.isSpeaking;
  }

  /**
   * 一時停止中かどうかを確認
   */
  public isPaused(): boolean {
    return this.synthesis ? this.synthesis.paused : false;
  }

  /**
   * サポート状況を取得
   */
  public isSynthesisSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): AudioProcessingState {
    return { ...this.state };
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): SpeechSynthesisConfig {
    return { ...this.config };
  }

  /**
   * 音声合成エラーを処理
   */
  private handleSynthesisError(event: SpeechSynthesisErrorEvent): void {
    let errorType = "unknown";

    switch (event.error) {
      case "audio-busy":
      case "audio-hardware":
        errorType = "audio-capture";
        break;
      case "network":
        errorType = "network";
        break;
      case "synthesis-unavailable":
      case "synthesis-failed":
        errorType = "service-not-allowed";
        break;
      case "language-unavailable":
        errorType = "not-supported";
        break;
      case "voice-unavailable":
        errorType = "not-found";
        break;
      case "text-too-long":
      case "invalid-argument":
        errorType = "aborted";
        break;
      default:
        errorType = "unknown";
    }

    this.handleError(errorType);
  }

  /**
   * エラーを処理
   */
  private handleError(errorType: string): void {
    const message = getLocalizedErrorMessage(errorType);
    this.state.error = message;
    this.events.onError?.(message);
    console.error("SpeechSynthesisService Error:", message);
  }

  /**
   * エラーをクリア
   */
  private clearError(): void {
    this.state.error = null;
  }

  /**
   * リソースをクリーンアップ
   */
  public cleanup(): void {
    this.stop();
    this.currentUtterance = null;
    this.state = {
      isRecording: false,
      isListening: false,
      isSpeaking: false,
      audioLevel: 0,
      error: null,
    };
  }
}
