import { blendShapeService } from "./blend-shape-service";
import { SpeechSynthesisService } from "./speech-synthesis";
import { AdvancedLipSyncService } from "./advanced-lipsync-service";
import { LipSyncService } from "./lipsync-service";

/**
 * 統合リップシンクサービス
 * TTS音声とリップシンクの統合制御、感情表現、AI応答連動
 */
export class IntegratedLipSyncService {
  private speechSynthesis: SpeechSynthesisService;
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
    this.speechSynthesis = new SpeechSynthesisService();
    this.advancedLipSync = new AdvancedLipSyncService();
    this.basicLipSync = new LipSyncService();

    this.setupTTSIntegration();
  }

  /**
   * TTS統合の初期化
   */
  private setupTTSIntegration(): void {
    // TTS音声合成イベントの監視
    this.speechSynthesis.setEventListeners({
      onSpeechStart: () => {
        console.log("TTS音声開始イベント受信");
        this.handleTTSSpeechStart();
      },
      onSpeechEnd: () => {
        console.log("TTS音声終了イベント受信");
        this.handleTTSSpeechEnd();
      },
      onError: (error: string) => {
        console.error("TTS音声エラー:", error);
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
    if (!this.isAutoMode) return;

    try {
      // 感情解析
      const detectedEmotion = emotion || this.analyzeTextEmotion(responseText);

      // 感情表現を適用
      await this.applyEmotion(detectedEmotion);

      // TTS音声の準備
      await this.prepareTTSLipSync();

      // TTS音声開始（リップシンクは自動で開始される）
      const success = this.speechSynthesis.speak(responseText);

      if (success) {
        console.log(
          `AI応答リップシンク開始: ${responseText.substring(0, 50)}...`
        );
        console.log(`検出された感情: ${detectedEmotion}`);

        // 音声合成の状態を定期的にチェック
        this.startSpeechStatusMonitoring();
      } else {
        console.error("音声合成の開始に失敗しました");
        this.isTTSSpeaking = false;
      }
    } catch (error) {
      console.error("AI応答リップシンク開始エラー:", error);
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
        console.log("🔍 音声合成終了を検知 - 状態を更新");
        this.handleTTSSpeechEnd();
      } else if (this.isTTSSpeaking && monitorCount < maxChecks) {
        // まだ話している場合は継続監視
        setTimeout(checkStatus, 200);
      } else if (monitorCount >= maxChecks) {
        // タイムアウト - 強制終了
        console.warn("⚠️ 音声合成監視タイムアウト - 強制終了");
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
    console.log("🛑 TTS音声強制停止");
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

      console.log(`マイクロフォンリップシンク開始 (${this.currentMode}モード)`);
    } catch (error) {
      console.error("マイクロフォンリップシンク開始エラー:", error);
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

    console.log("統合リップシンク停止");
  }

  /**
   * TTS音声開始時の処理
   */
  private async handleTTSSpeechStart(): Promise<void> {
    this.isTTSSpeaking = true;
    console.log("TTS音声開始 - リップシンク開始");

    // TTS音声の解析を開始
    await this.startTTSAnalysis();
  }

  /**
   * TTS音声終了時の処理
   */
  private handleTTSSpeechEnd(): void {
    console.log("🔊 TTS音声終了イベント受信");
    this.isTTSSpeaking = false;

    // TTS解析を停止
    this.stopTTSAnalysis();

    // 表情を徐々にニュートラルに戻す
    setTimeout(() => {
      this.applyEmotion("neutral", 0.3);
    }, 500);

    console.log("✅ TTS音声終了 - 統合リップシンク停止完了");
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
    } catch (error) {
      console.error("TTS音声解析準備エラー:", error);
    }
  }

  /**
   * TTS音声解析開始
   */
  private async startTTSAnalysis(): Promise<void> {
    if (!this.ttsAudioContext) return;

    try {
      // 音声出力をキャプチャ（実際の実装では制限があるため、代替手法を使用）
      // ここでは音量ベースの簡易リップシンクを実装
      this.startTTSVolumeBasedLipSync();
    } catch (error) {
      console.error("TTS音声解析開始エラー:", error);
    }
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

    console.log(`感情表現適用: ${emotion} (強度: ${intensity})`);
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
