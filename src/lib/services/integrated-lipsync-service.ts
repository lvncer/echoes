import { blendShapeService } from "./blend-shape-service";
import { IntegratedSpeechService } from "./integrated-speech-service";
import { AdvancedLipSyncService } from "./advanced-lipsync-service";
import { LipSyncService } from "./lipsync-service";
import type { AnimationController } from "./animation-controller";

/**
 * 統合リップシンクサービス
 * TTS音声とリップシンクの統合制御、感情表現、AI応答連動
 */
export class IntegratedLipSyncService {
  private speechSynthesis: IntegratedSpeechService;
  private advancedLipSync: AdvancedLipSyncService;
  private basicLipSync: LipSyncService;

  private isActive = false;
  private currentMode: "basic" | "advanced" = "advanced";
  private isAutoMode = true; // AI応答時の自動リップシンク

  // 感情表現制御
  private currentEmotion: EmotionType = "neutral";
  private emotionIntensity = 0.5;
  private emotionDuration = 2000; // ms

  // TTS連動制御
  private isTTSSpeaking = false;
  private ttsAudioContext: AudioContext | null = null;
  private ttsAnalyser: AnalyserNode | null = null;
  private ttsAnimationFrame: number | null = null;

  constructor() {
    this.speechSynthesis = new IntegratedSpeechService();
    this.advancedLipSync = new AdvancedLipSyncService();
    this.basicLipSync = new LipSyncService();

    this.setupTTSIntegration();
    this.setupAnimationController().catch(console.warn);
  }

  /**
   * アニメーションコントローラーのセットアップ
   */
  private async setupAnimationController(): Promise<void> {
    // SSR中はスキップ
    if (typeof window === "undefined") {
      return;
    }

    // サービスコンテナからアニメーションコントローラーを取得
    try {
      const { serviceContainer } = await import("./service-container");
      this.speechSynthesis.setAnimationController(serviceContainer.animationController);
    } catch (error) {
      console.warn("Failed to load animation controller from service container:", error);
    }
  }

  /**
   * TTS統合の初期化
   */
  private setupTTSIntegration(): void {
    // TTS音声合成イベントの監視
    this.speechSynthesis.setEventListeners({
      onAudioReady: (audioElement: HTMLAudioElement) => {
        // VOICEVOX音声要素が準備完了した時点でリップシンク開始
        this.handleVoicevoxAudioReady(audioElement);
      },
      onSpeakStart: () => {
        this.handleTTSSpeechStart();
      },
      onSpeakEnd: () => {
        this.handleTTSSpeechEnd();
      },
      onError: (_error) => {
        this.handleTTSSpeechEnd();
      },
    });
  }

  /**
   * AI応答時の自動リップシンク開始
   */
  async startAIResponseLipSync(
    responseText: string,
    emotion?: EmotionType
  ): Promise<void> {
    if (!this.isAutoMode) {
      return;
    }
    try {
      // 感情解析
      const detectedEmotion = emotion || this.analyzeTextEmotion(responseText);

      // 感情表現を適用
      await this.applyEmotion(detectedEmotion);

      // TTS音声の準備
      await this.prepareTTSLipSync();

      // TTS音声開始（リップシンクは自動で開始される）
      const success = await this.speechSynthesis.speak(responseText);

      if (success) {
        // 音声合成の状態を定期的にチェック
        this.startSpeechStatusMonitoring();
      } else {
        this.isTTSSpeaking = false;
      }
    } catch {
      this.isTTSSpeaking = false;
    }
  }

  /**
   * 音声合成状態の監視を開始
   */
  private startSpeechStatusMonitoring(): void {
    let monitorCount = 0;
    const maxMonitorTime = 30000; // 30秒でタイムアウト
    const maxChecks = maxMonitorTime / 200;

    const checkStatus = () => {
      monitorCount++;
      const isSpeaking = this.speechSynthesis.isSpeaking();

      if (this.isTTSSpeaking && !isSpeaking) {
        // 音声合成が終了したが、内部状態がまだ話し中の場合
        this.handleTTSSpeechEnd();
      } else if (this.isTTSSpeaking && monitorCount < maxChecks) {
        // まだ話している場合は継続監視
        setTimeout(checkStatus, 200);
      } else if (monitorCount >= maxChecks) {
        // タイムアウト - 強制終了
        this.forceStopTTS();
      }
    };

    // 1秒後から監視開始
    setTimeout(checkStatus, 1000);
  }

  /**
   * TTS音声を強制停止
   */
  private forceStopTTS(): void {
    this.isTTSSpeaking = false;
    this.speechSynthesis.stop();
    this.stopTTSAnalysis();
    this.applyEmotion("neutral", 0.3);
  }

  /**
   * マイク入力リップシンク開始
   */
  async startMicrophoneLipSync(stream: MediaStream): Promise<void> {
    try {
      this.isActive = true;

      if (this.currentMode === "advanced") {
        await this.advancedLipSync.startAdvancedLipSync(stream);
      } else {
        await this.basicLipSync.startLipSync(stream);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * リップシンク停止
   */
  stopLipSync(): void {
    this.isActive = false;

    // 各サービスを停止
    this.advancedLipSync.stopAdvancedLipSync();
    this.basicLipSync.stopLipSync();
    this.speechSynthesis.stop();

    // TTS解析を停止
    this.stopTTSAnalysis();

    // 表情をリセット
    this.resetExpression();
  }

  /**
   * VOICEVOX音声要素準備完了時の処理
   */
  private async handleVoicevoxAudioReady(
    audioElement: HTMLAudioElement
  ): Promise<void> {
    try {
      // VOICEVOX音声のリップシンク準備
      await this.startVoicevoxLipSync(audioElement);
    } catch {}
  }

  /**
   * TTS音声開始時の処理
   */
  private async handleTTSSpeechStart(): Promise<void> {
    this.isTTSSpeaking = true;
    const audioElement = this.speechSynthesis.getCurrentAudioElement();

    if (!audioElement) {
      // Web Speech API音声の場合：従来の解析
      await this.startTTSAnalysis();
    }
    // VOICEVOX音声の場合は、onAudioReadyで既にリップシンクが設定済み
  }

  /**
   * TTS音声終了時の処理
   */
  private handleTTSSpeechEnd(): void {
    this.isTTSSpeaking = false;

    // TTS解析を停止
    this.stopTTSAnalysis();

    // 口の動きをリセット
    blendShapeService.resetMouthBlendShapes();

    // 表情を徐々にニュートラルに戻す
    setTimeout(() => {
      this.applyEmotion("neutral", 0.3);
    }, 500);
  }

  /**
   * TTS音声解析の準備
   */
  private async prepareTTSLipSync(): Promise<void> {
    try {
      // Web Audio APIの初期化
      if (!this.ttsAudioContext) {
        this.ttsAudioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      if (this.ttsAudioContext.state === "suspended") {
        await this.ttsAudioContext.resume();
      }
    } catch {}
  }

  /**
   * VOICEVOX音声のリップシンク開始
   */
  private async startVoicevoxLipSync(
    audioElement: HTMLAudioElement
  ): Promise<void> {
    try {
      // Web Audio APIでVOICEVOX音声を解析
      if (!this.ttsAudioContext) {
        await this.prepareTTSLipSync();
      }

      if (!this.ttsAudioContext) return;

      // 音声再生開始を待つ
      const waitForPlay = () => {
        return new Promise<void>((resolve) => {
          if (!audioElement.paused) {
            resolve();
            return;
          }

          const onPlay = () => {
            audioElement.removeEventListener("play", onPlay);
            resolve();
          };
          audioElement.addEventListener("play", onPlay);

          // タイムアウト（5秒）
          setTimeout(() => {
            audioElement.removeEventListener("play", onPlay);
            resolve();
          }, 5000);
        });
      };

      await waitForPlay();

      // MediaElementSourceを作成（一度だけ作成可能）
      let source: MediaElementAudioSourceNode;
      try {
        source = this.ttsAudioContext.createMediaElementSource(audioElement);
      } catch {
        // 既に作成済みの場合はエラーになるので、フォールバックを使用
        this.startTTSVolumeBasedLipSync();
        return;
      }

      // アナライザーを作成
      this.ttsAnalyser = this.ttsAudioContext.createAnalyser();
      this.ttsAnalyser.fftSize = 256;
      this.ttsAnalyser.smoothingTimeConstant = 0.8;

      // 音声要素 → アナライザー → 出力
      source.connect(this.ttsAnalyser);
      this.ttsAnalyser.connect(this.ttsAudioContext.destination);

      // リアルタイム解析開始
      this.startVoicevoxRealtimeLipSync();
    } catch {
      // フォールバック：簡易リップシンク
      this.startTTSVolumeBasedLipSync();
    }
  }

  /**
   * VOICEVOXリアルタイムリップシンク
   */
  private startVoicevoxRealtimeLipSync(): void {
    if (!this.ttsAnalyser) {
      return;
    }

    const bufferLength = this.ttsAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      if (!this.isTTSSpeaking || !this.ttsAnalyser) return;

      // 周波数データを取得
      this.ttsAnalyser.getByteFrequencyData(dataArray);

      // 音量レベルを計算
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedVolume = average / 255;

      // 周波数帯域別の解析
      const lowFreq = this.getFrequencyBandAverage(dataArray, 0, 4); // 低音域
      const midFreq = this.getFrequencyBandAverage(dataArray, 4, 16); // 中音域
      const highFreq = this.getFrequencyBandAverage(dataArray, 16, 32); // 高音域

      // 音素推定とブレンドシェイプ適用
      this.applyVoicevoxLipSync(normalizedVolume, lowFreq, midFreq, highFreq);

      this.ttsAnimationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * 周波数帯域の平均を取得
   */
  private getFrequencyBandAverage(
    dataArray: Uint8Array,
    startIndex: number,
    endIndex: number
  ): number {
    const bandData = dataArray.slice(startIndex, endIndex);
    const average =
      bandData.reduce((sum, value) => sum + value, 0) / bandData.length;
    return average / 255;
  }

  /**
   * VOICEVOX音声に基づくリップシンク適用
   */
  private applyVoicevoxLipSync(
    volume: number,
    lowFreq: number,
    midFreq: number,
    highFreq: number
  ): void {
    // 音量に基づく基本的な口の開閉
    const mouthOpening = Math.min(volume * 1.5, 1.0);

    // 周波数特性に基づく音素推定
    let primaryPhoneme = "aa";
    let secondaryPhoneme = "";
    let primaryWeight = mouthOpening;
    let secondaryWeight = 0;

    if (volume > 0.1) {
      if (highFreq > midFreq && highFreq > lowFreq) {
        // 高音域が強い → i, e 音
        primaryPhoneme = midFreq > lowFreq ? "ih" : "ee";
        primaryWeight = Math.min(volume * 1.2, 1.0);
      } else if (lowFreq > midFreq && lowFreq > highFreq) {
        // 低音域が強い → o, u 音
        primaryPhoneme = midFreq > 0.3 ? "oh" : "ou";
        primaryWeight = Math.min(volume * 1.1, 1.0);
      } else if (midFreq > 0.4) {
        // 中音域が強い → a 音
        primaryPhoneme = "aa";
        primaryWeight = Math.min(volume * 1.3, 1.0);
      }

      // セカンダリ音素の設定（より自然な口の動き）
      if (volume > 0.3) {
        const phonemes = ["aa", "ih", "ou", "ee", "oh"];
        const currentIndex = phonemes.indexOf(primaryPhoneme);
        const nextIndex = (currentIndex + 1) % phonemes.length;
        secondaryPhoneme = phonemes[nextIndex];
        secondaryWeight = Math.min(volume * 0.3, 0.3);
      }
    }

    // ブレンドシェイプを適用
    blendShapeService.resetMouthBlendShapes();

    if (primaryWeight > 0) {
      blendShapeService.setBlendShapeWeight(primaryPhoneme, primaryWeight);
    }

    if (secondaryWeight > 0 && secondaryPhoneme) {
      blendShapeService.setBlendShapeWeight(secondaryPhoneme, secondaryWeight);
    }
  }

  /**
   * TTS音声解析開始（Web Speech API用）
   */
  private async startTTSAnalysis(): Promise<void> {
    if (!this.ttsAudioContext) return;

    try {
      // 音声出力をキャプチャ（実際の実装では制限があるため、代替手法を使用）
      // ここでは音量ベースの簡易リップシンクを実装
      this.startTTSVolumeBasedLipSync();
    } catch (_error) {}
  }

  /**
   * TTS音量ベースリップシンク
   */
  private startTTSVolumeBasedLipSync(): void {
    let phase = 0;
    const frequency = 0.1; // 口パクの周波数

    const animate = () => {
      if (!this.isTTSSpeaking) return;

      // 簡易的な口パクアニメーション
      phase += frequency;
      const mouthOpening = (Math.sin(phase) + 1) * 0.3; // 0-0.6の範囲

      // VRM 1.0形式の音素を使用（ニコニ立体ちゃん対応）
      const phonemes = ["aa", "ih", "ou", "ee", "oh"]; // VRM 1.0形式を優先
      const randomPhoneme =
        phonemes[Math.floor(Math.random() * phonemes.length)];

      // ブレンドシェイプを適用（マッピング機能により自動変換される）
      blendShapeService.setBlendShapeWeight(randomPhoneme, mouthOpening);

      this.ttsAnimationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * TTS解析停止
   */
  private stopTTSAnalysis(): void {
    if (this.ttsAnimationFrame) {
      cancelAnimationFrame(this.ttsAnimationFrame);
      this.ttsAnimationFrame = null;
    }
  }

  /**
   * テキストから感情を解析
   */
  private analyzeTextEmotion(text: string): EmotionType {
    // 簡易的な感情解析（キーワードベース）
    const emotionKeywords = {
      happy: [
        "嬉しい",
        "楽しい",
        "良い",
        "素晴らしい",
        "最高",
        "ありがとう",
        "😊",
        "😄",
        "🎉",
      ],
      sad: [
        "悲しい",
        "残念",
        "困った",
        "申し訳",
        "すみません",
        "😢",
        "😞",
        "💧",
      ],
      angry: ["怒り", "腹立つ", "ムカつく", "許せない", "😠", "😡", "💢"],
      surprised: [
        "驚き",
        "びっくり",
        "まさか",
        "信じられない",
        "😲",
        "😮",
        "‼️",
      ],
      neutral: [],
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return emotion as EmotionType;
      }
    }

    return "neutral";
  }

  /**
   * 感情表現を適用
   */
  private async applyEmotion(
    emotion: EmotionType,
    intensity: number = this.emotionIntensity
  ): Promise<void> {
    this.currentEmotion = emotion;

    // 感情に対応するブレンドシェイプを設定
    const emotionBlendShapes = this.getEmotionBlendShapes(emotion, intensity);

    // 既存の表情をリセット
    blendShapeService.resetAllBlendShapes();

    // 新しい表情を適用
    blendShapeService.setMultipleBlendShapes(emotionBlendShapes);
  }

  /**
   * 感情に対応するブレンドシェイプを取得
   */
  private getEmotionBlendShapes(
    emotion: EmotionType,
    intensity: number
  ): Record<string, number> {
    const emotionMappings: Record<EmotionType, Record<string, number>> = {
      neutral: {},
      happy: {
        Joy: intensity * 0.8,
        A: intensity * 0.3,
      },
      sad: {
        Sorrow: intensity * 0.7,
        E: intensity * 0.2,
      },
      angry: {
        Angry: intensity * 0.8,
        U: intensity * 0.4,
      },
      surprised: {
        Fun: intensity * 0.9,
        A: intensity * 0.5,
        O: intensity * 0.3,
      },
    };

    return emotionMappings[emotion] || {};
  }

  /**
   * 表情をリセット
   */
  private resetExpression(): void {
    blendShapeService.resetAllBlendShapes();
    this.currentEmotion = "neutral";
  }

  // 設定メソッド
  public setMode(mode: "basic" | "advanced"): void {
    this.currentMode = mode;
  }

  public setAutoMode(enabled: boolean): void {
    this.isAutoMode = enabled;
  }

  public setEmotionIntensity(intensity: number): void {
    this.emotionIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * アニメーションコントローラーを動的に設定
   */
  public setAnimationController(controller?: AnimationController): void {
    if (controller) {
      this.speechSynthesis.setAnimationController(controller);
    } else {
      this.setupAnimationController();
    }
  }

  // 状態取得メソッド
  public getStatus() {
    return {
      isActive: this.isActive,
      currentMode: this.currentMode,
      isAutoMode: this.isAutoMode,
      currentEmotion: this.currentEmotion,
      isTTSSpeaking: this.isTTSSpeaking,
    };
  }
}

// 感情タイプの定義
export type EmotionType = "neutral" | "happy" | "sad" | "angry" | "surprised";

// シングルトンインスタンス
export const integratedLipSyncService = new IntegratedLipSyncService();
