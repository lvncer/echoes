import type {
  SpeechRecognitionConfig,
  SpeechRecognitionResult,
  AudioEvents,
  AudioProcessingState,
} from "@/lib/types/audio";
import {
  getSpeechRecognition,
  getLocalizedErrorMessage,
  detectBrowserSupport,
} from "@/lib/utils/audio-support";

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported = false;
  private events: Partial<AudioEvents> = {};

  private state: AudioProcessingState = {
    isRecording: false,
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    error: null,
  };

  private config: SpeechRecognitionConfig = {
    language: "ja-JP",
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  };

  constructor() {
    this.initialize();
  }

  /**
   * 音声認識を初期化
   */
  private initialize(): void {
    const support = detectBrowserSupport();
    this.isSupported = support.speechRecognition;

    if (!this.isSupported) {
      this.handleError("not-supported");
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognition();
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.setupRecognition();
    }
  }

  /**
   * 音声認識の設定
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // 基本設定
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // イベントリスナーを設定
    this.recognition.onstart = () => {
      this.state.isListening = true;
      this.clearError();
      this.events.onSpeechStart?.();
    };

    this.recognition.onend = () => {
      this.state.isListening = false;
      this.events.onSpeechEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleRecognitionError(event);
    };

    this.recognition.onspeechstart = () => {
      // 音声検出開始
    };

    this.recognition.onspeechend = () => {
      // 音声検出終了
    };

    this.recognition.onaudiostart = () => {
      // 音声入力開始
    };

    this.recognition.onaudioend = () => {
      // 音声入力終了
    };
  }

  /**
   * 音声認識結果を処理
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    if (!event.results) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternative = result[0];

      if (alternative) {
        const recognitionResult: SpeechRecognitionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence || 0,
          isFinal: result.isFinal,
        };

        this.events.onResult?.(recognitionResult);
      }
    }
  }

  /**
   * 音声認識エラーを処理
   */
  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    let errorType = event.error || "unknown";

    // エラータイプを標準化
    switch (errorType) {
      case "no-speech":
        errorType = "no-speech";
        break;
      case "audio-capture":
        errorType = "audio-capture";
        break;
      case "not-allowed":
        errorType = "not-allowed";
        break;
      case "network":
        errorType = "network";
        break;
      case "service-not-allowed":
        errorType = "service-not-allowed";
        break;
      case "aborted":
        errorType = "aborted";
        break;
      default:
        errorType = "unknown";
    }

    this.handleError(errorType);
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
  public updateConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * 音声認識を開始
   */
  public start(): boolean {
    if (!this.isSupported || !this.recognition) {
      this.handleError("not-supported");
      return false;
    }

    if (this.state.isListening) {
      return true; // 既に開始済み
    }

    try {
      this.recognition.start();
      return true;
    } catch {
      this.handleError("audio-capture");
      return false;
    }
  }

  /**
   * 音声認識を停止
   */
  public stop(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * 音声認識を中止
   */
  public abort(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * 音声認識がサポートされているかチェック
   */
  public isRecognitionSupported(): boolean {
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
  public getConfig(): SpeechRecognitionConfig {
    return { ...this.config };
  }

  /**
   * エラーハンドリング
   */
  private handleError(errorType: string): void {
    const message = getLocalizedErrorMessage(errorType);
    this.state.error = message;
    this.events.onError?.(message);
    console.error("SpeechRecognition エラー:", message);
  }

  /**
   * エラーをクリア
   */
  private clearError(): void {
    this.state.error = null;
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    if (this.recognition) {
      this.stop();
      this.recognition = null;
    }
    this.events = {};
  }
}
