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
    rate: 0.9,
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
      // 1. 日本語のネイティブ音声を最優先
      let japaneseVoice = this.availableVoices.find(
        (voice) => voice.lang.startsWith("ja") && voice.localService
      );

      // 2. 日本語音声（ネイティブでなくても可）
      if (!japaneseVoice) {
        japaneseVoice = this.availableVoices.find((voice) =>
          voice.lang.startsWith("ja")
        );
      }

      // 3. デフォルト音声
      if (!japaneseVoice) {
        japaneseVoice = this.availableVoices.find((voice) => voice.default);
      }

      // 4. 最初の音声
      if (!japaneseVoice) {
        japaneseVoice = this.availableVoices[0];
      }

      this.config.voice = japaneseVoice;

      if (japaneseVoice) {
        console.log(
          `🎤 選択された音声: ${japaneseVoice.name} (${japaneseVoice.lang})`
        );
      }
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
    if (!this.isSupported) {
      this.handleError("not-supported", "音声合成がサポートされていません");
      return false;
    }

    if (!text || text.trim().length === 0) {
      console.warn("⚠️ 空のテキストが指定されました");
      return false;
    }

    // 既に再生中の場合は停止
    if (this.state.isSpeaking) {
      this.stop();
      // 少し待機してから新しい音声を開始
      setTimeout(() => this.speak(text), 100);
      return true;
    }

    // 長いテキストの場合は分割して処理
    if (text.length > 200) {
      return this.speakLongText(text);
    }

    return this.speakSingleUtterance(text);
  }

  /**
   * 長いテキストを分割して音声合成
   */
  private speakLongText(text: string): boolean {
    // 文章を適切な長さで分割
    const chunks = this.splitTextIntoChunks(text, 150);

    if (chunks.length === 0) {
      return false;
    }

    console.log(`📝 長いテキストを${chunks.length}個のチャンクに分割`);

    // 最初のチャンクを再生
    this.speakChunks(chunks, 0);
    return true;
  }

  /**
   * テキストを適切な長さのチャンクに分割
   */
  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // 文で分割
    const sentences = text.split(/[。！？\.\!\?]/);

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // 句読点を復元
      const fullSentence =
        trimmedSentence +
        (text.includes(trimmedSentence + "。")
          ? "。"
          : text.includes(trimmedSentence + "！")
          ? "！"
          : text.includes(trimmedSentence + "？")
          ? "？"
          : "。");

      if (currentChunk.length + fullSentence.length <= maxLength) {
        currentChunk += fullSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = fullSentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * チャンクを順次再生
   */
  private speakChunks(chunks: string[], index: number): void {
    if (index >= chunks.length) {
      console.log("🎤 全チャンクの再生完了");
      return;
    }

    const chunk = chunks[index];
    console.log(
      `🎤 チャンク ${index + 1}/${chunks.length} を再生: "${chunk.substring(
        0,
        30
      )}..."`
    );

    // 次のチャンクを再生するためのコールバックを設定
    const originalOnSpeechEnd = this.events.onSpeechEnd;

    this.events.onSpeechEnd = () => {
      // 元のコールバックを復元
      this.events.onSpeechEnd = originalOnSpeechEnd;

      // 最後のチャンクでない場合は次のチャンクを再生
      if (index < chunks.length - 1) {
        setTimeout(() => {
          this.speakChunks(chunks, index + 1);
        }, 100); // 短い間隔で次のチャンクを再生
      } else {
        // 全チャンク完了時に元のコールバックを呼び出し
        originalOnSpeechEnd?.();
      }
    };

    this.speakSingleUtterance(chunk);
  }

  /**
   * 単一のテキストを音声合成
   */
  private speakSingleUtterance(text: string): boolean {
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

      // タイムアウト設定を調整（より長めに設定）
      const baseTimeout = 15000; // 基本15秒
      const textTimeout = text.length * 150; // 文字数×150ms
      const timeoutDuration = Math.max(baseTimeout, textTimeout);
      let timeoutId: NodeJS.Timeout | null = null;

      // 音声合成の状態監視用
      let isCompleted = false;
      let statusCheckInterval: NodeJS.Timeout | null = null;

      // イベントリスナーを設定
      utterance.onstart = () => {
        console.log("🎤 SpeechSynthesis: 音声開始");
        this.state.isSpeaking = true;
        this.clearError();
        this.events.onSpeechStart?.();

        // タイムアウトを設定
        timeoutId = setTimeout(() => {
          if (!isCompleted) {
            console.warn("⚠️ 音声合成タイムアウト - 強制停止");
            this.forceStop();
          }
        }, timeoutDuration);

        // 状態監視を開始
        statusCheckInterval = setInterval(() => {
          if (
            this.synthesis &&
            !this.synthesis.speaking &&
            !this.synthesis.pending
          ) {
            if (!isCompleted) {
              console.log("🔍 音声合成が予期せず停止 - 終了処理を実行");
              this.handleUnexpectedStop();
            }
          }
        }, 500);
      };

      utterance.onend = () => {
        console.log("🎤 SpeechSynthesis: 音声終了");
        isCompleted = true;
        this.state.isSpeaking = false;
        this.currentUtterance = null;

        // タイムアウトとインターバルをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          statusCheckInterval = null;
        }

        this.events.onSpeechEnd?.();
      };

      utterance.onerror = (event) => {
        console.warn("🚨 SpeechSynthesis: エラー発生", event.error);
        isCompleted = true;
        this.state.isSpeaking = false;
        this.currentUtterance = null;

        // タイムアウトとインターバルをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          statusCheckInterval = null;
        }

        this.handleSynthesisError(event);
      };

      utterance.onpause = () => {
        console.log("⏸️ SpeechSynthesis: 一時停止");
      };

      utterance.onresume = () => {
        console.log("▶️ SpeechSynthesis: 再開");
      };

      this.currentUtterance = utterance;

      // ブラウザ制限の確認
      const limitations = getBrowserLimitations();
      if (limitations.requiresUserGesture) {
        console.log("👆 ユーザージェスチャーが必要です");
      }

      console.log(
        `🎤 音声合成開始: "${text.substring(0, 50)}${
          text.length > 50 ? "..." : ""
        }"`
      );

      if (!this.synthesis) {
        this.handleError("not-supported", "音声合成サービスが利用できません");
        return false;
      }

      // 音声合成キューをクリアしてから開始
      this.synthesis.cancel();

      // 少し待機してから開始
      setTimeout(() => {
        if (this.synthesis && this.currentUtterance) {
          this.synthesis.speak(this.currentUtterance);
        }
      }, 50);

      return true;
    } catch (error) {
      console.error("🚨 音声合成開始エラー:", error);
      this.handleError("audio-capture", `音声合成開始エラー: ${error}`);
      return false;
    }
  }

  /**
   * 予期しない停止の処理
   */
  private handleUnexpectedStop(): void {
    console.log("🔧 予期しない停止を検出 - 終了処理を実行");
    this.state.isSpeaking = false;
    this.currentUtterance = null;
    this.events.onSpeechEnd?.();
  }

  /**
   * 強制停止
   */
  private forceStop(): void {
    console.log("🛑 音声合成を強制停止");
    this.state.isSpeaking = false;
    this.currentUtterance = null;

    if (this.synthesis) {
      this.synthesis.cancel();
    }

    this.events.onSpeechEnd?.();
  }

  /**
   * 音声再生を停止
   */
  public stop(): void {
    try {
      if (this.synthesis && this.state.isSpeaking) {
        console.log("🛑 SpeechSynthesis: 音声停止開始");

        // 現在の発話を取得
        const currentUtterance = this.currentUtterance;

        // 状態を先にリセット（エラー防止）
        this.state.isSpeaking = false;
        this.currentUtterance = null;

        // 音声合成をキャンセル
        this.synthesis.cancel();

        // 終了イベントを発火（ただし、既に終了していない場合のみ）
        if (currentUtterance) {
          console.log("🛑 SpeechSynthesis: 音声停止完了");
          this.events.onSpeechEnd?.();
        }
      } else {
        console.log("🛑 SpeechSynthesis: 停止対象なし");
      }
    } catch (error) {
      console.warn("⚠️ SpeechSynthesis停止時エラー:", error);
      // エラーが発生しても状態はリセット
      this.state.isSpeaking = false;
      this.currentUtterance = null;
      this.events.onSpeechEnd?.();
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
    console.warn("🚨 SpeechSynthesis Error Event:", {
      error: event.error,
      type: event.type,
      target: event.target,
      timeStamp: event.timeStamp,
    });

    let errorType = "unknown";
    let detailedMessage = "";

    // TypeScriptの型定義が実際のブラウザ実装と異なる場合があるため、stringとして扱う
    const errorCode = event.error as string;

    switch (errorCode) {
      case "audio-busy":
        errorType = "audio-capture";
        detailedMessage = "音声デバイスがビジー状態です";
        break;
      case "audio-hardware":
        errorType = "audio-capture";
        detailedMessage = "音声ハードウェアエラーです";
        break;
      case "network":
        errorType = "network";
        detailedMessage = "ネットワークエラーです";
        break;
      case "synthesis-unavailable":
        errorType = "service-not-allowed";
        detailedMessage = "音声合成サービスが利用できません";
        break;
      case "synthesis-failed":
        errorType = "service-not-allowed";
        detailedMessage = "音声合成に失敗しました";
        break;
      case "language-unavailable":
        errorType = "not-supported";
        detailedMessage = "指定された言語がサポートされていません";
        break;
      case "voice-unavailable":
        errorType = "not-found";
        detailedMessage = "指定された音声が見つかりません";
        break;
      case "text-too-long":
        errorType = "aborted";
        detailedMessage = "テキストが長すぎます";
        break;
      case "invalid-argument":
        errorType = "aborted";
        detailedMessage = "無効な引数です";
        break;
      case "not-allowed":
        errorType = "permission-denied";
        detailedMessage = "音声合成が許可されていません";
        break;
      case "canceled":
        // キャンセルは正常な動作なのでエラーとして扱わない
        console.log("🔄 音声合成がキャンセルされました（正常）");
        return;
      case "interrupted":
        // 中断は正常な動作なのでエラーとして扱わない
        console.log("🔄 音声合成が中断されました（正常）");
        return;
      default:
        errorType = "unknown";
        detailedMessage = `不明なエラー: ${errorCode}`;
    }

    // 状態をリセット
    this.state.isSpeaking = false;
    this.currentUtterance = null;

    // エラーを報告（ただし、中断・キャンセルエラーは除く）
    if (errorCode !== "canceled" && errorCode !== "interrupted") {
      this.handleError(errorType, detailedMessage);
    }
  }

  /**
   * エラーを処理
   */
  private handleError(errorType: string, detailedMessage?: string): void {
    const baseMessage = getLocalizedErrorMessage(errorType);
    const message = detailedMessage
      ? `${baseMessage}: ${detailedMessage}`
      : baseMessage;

    this.state.error = message;
    this.events.onError?.(message);

    console.error("🚨 SpeechSynthesisService Error:", {
      type: errorType,
      message: message,
      timestamp: new Date().toISOString(),
    });
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
