/**
 * 音声解析サービス
 * Web Audio APIを使用してリアルタイム音声解析を行う
 */
export class AudioAnalysisService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;
  private isAnalyzing = false;

  // 音量レベルコールバック
  private volumeCallback: ((volume: number) => void) | null = null;

  // 音量レベルの設定
  private volumeThreshold = 0.01; // 音量検出の閾値
  private smoothingFactor = 0.8; // スムージング係数
  private currentVolume = 0;

  /**
   * 音声解析を開始
   */
  async startAnalysis(stream: MediaStream): Promise<void> {
    try {
      // AudioContextを作成
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // AnalyserNodeを作成
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = this.smoothingFactor;

      // マイクロフォンの音声ソースを作成
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // データ配列を初期化
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // 解析開始
      this.isAnalyzing = true;
      this.analyze();

      console.log("音声解析開始");
    } catch (error) {
      console.error("音声解析開始エラー:", error);
      throw error;
    }
  }

  /**
   * 音声解析を停止
   */
  stopAnalysis(): void {
    this.isAnalyzing = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.currentVolume = 0;

    console.log("音声解析停止");
  }

  /**
   * 音量レベルコールバックを設定
   */
  setVolumeCallback(callback: (volume: number) => void): void {
    this.volumeCallback = callback;
  }

  /**
   * 音量閾値を設定
   */
  setVolumeThreshold(threshold: number): void {
    this.volumeThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * スムージング係数を設定
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.smoothingFactor;
    }
  }

  /**
   * 現在の音量レベルを取得
   */
  getCurrentVolume(): number {
    return this.currentVolume;
  }

  /**
   * 解析状態を取得
   */
  isAnalysisActive(): boolean {
    return this.isAnalyzing;
  }

  /**
   * リアルタイム音声解析
   */
  private analyze(): void {
    if (!this.isAnalyzing || !this.analyser || !this.dataArray) {
      return;
    }

    // 周波数データを取得
    this.analyser.getByteFrequencyData(this.dataArray);

    // 音量レベルを計算（RMS値）
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = this.dataArray[i] / 255.0; // 0-1に正規化
      sum += value * value;
    }

    const rms = Math.sqrt(sum / this.dataArray.length);

    // スムージング適用
    this.currentVolume =
      this.currentVolume * this.smoothingFactor +
      rms * (1 - this.smoothingFactor);

    // 閾値以上の場合のみコールバック実行
    if (this.currentVolume > this.volumeThreshold && this.volumeCallback) {
      this.volumeCallback(this.currentVolume);
    }

    // 次のフレームをスケジュール
    this.animationFrame = requestAnimationFrame(() => this.analyze());
  }

  /**
   * 音量レベルを口の開き具合にマッピング
   */
  static volumeToMouthOpening(volume: number): number {
    // 音量を0-1の範囲で口の開き具合にマッピング
    const normalizedVolume = Math.max(0, Math.min(1, volume));

    // 指数関数的なマッピングでより自然な動きを実現
    return Math.pow(normalizedVolume * 2, 1.5);
  }

  /**
   * 音量レベルから基本的な音素を推定（簡易版）
   */
  static volumeToBasicPhoneme(volume: number): string {
    if (volume < 0.1) return "sil"; // 無音
    if (volume < 0.3) return "A"; // 小さな音量
    if (volume < 0.6) return "E"; // 中程度の音量
    if (volume < 0.8) return "I"; // 大きな音量
    return "O"; // 最大音量
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    isAnalyzing: boolean;
    currentVolume: number;
    volumeThreshold: number;
    smoothingFactor: number;
    audioContextState: string;
  } {
    return {
      isAnalyzing: this.isAnalyzing,
      currentVolume: this.currentVolume,
      volumeThreshold: this.volumeThreshold,
      smoothingFactor: this.smoothingFactor,
      audioContextState: this.audioContext?.state || "closed",
    };
  }
}

// シングルトンインスタンス
export const audioAnalysisService = new AudioAnalysisService();
