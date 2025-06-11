/**
 * 音素解析サービス
 * フォルマント解析による音素検出とリップシンク用音素マッピング
 */

export interface PhonemeAnalysisResult {
  phoneme: string;
  confidence: number;
  formants: {
    f1: number;
    f2: number;
    f3: number;
  };
  volume: number;
  timestamp: number;
}

export interface PhonemeConfig {
  name: string;
  f1Range: [number, number];
  f2Range: [number, number];
  volumeThreshold: number;
  blendShapeMapping: Record<string, number>;
}

/**
 * 15音素の設定データ
 */
const PHONEME_CONFIGS: Record<string, PhonemeConfig> = {
  // 無音
  sil: {
    name: "sil",
    f1Range: [0, 100],
    f2Range: [0, 100],
    volumeThreshold: 0.01,
    blendShapeMapping: {},
  },

  // 基本母音
  aa: {
    name: "aa", // あ
    f1Range: [600, 900],
    f2Range: [1000, 1400],
    volumeThreshold: 0.1,
    blendShapeMapping: { A: 1.0 },
  },
  ih: {
    name: "ih", // い
    f1Range: [200, 400],
    f2Range: [2000, 2800],
    volumeThreshold: 0.1,
    blendShapeMapping: { I: 1.0 },
  },
  ou: {
    name: "ou", // う
    f1Range: [250, 450],
    f2Range: [600, 1000],
    volumeThreshold: 0.1,
    blendShapeMapping: { U: 1.0 },
  },
  E: {
    name: "E", // え
    f1Range: [400, 600],
    f2Range: [1600, 2200],
    volumeThreshold: 0.1,
    blendShapeMapping: { E: 1.0 },
  },
  oh: {
    name: "oh", // お
    f1Range: [300, 500],
    f2Range: [700, 1100],
    volumeThreshold: 0.1,
    blendShapeMapping: { O: 1.0 },
  },

  // 子音（唇音）
  PP: {
    name: "PP", // p, b
    f1Range: [100, 300],
    f2Range: [500, 1500],
    volumeThreshold: 0.05,
    blendShapeMapping: { U: 0.8 }, // 唇を閉じる
  },
  FF: {
    name: "FF", // f, v
    f1Range: [200, 400],
    f2Range: [1000, 2000],
    volumeThreshold: 0.08,
    blendShapeMapping: { U: 0.6, A: 0.2 },
  },

  // 子音（歯音）
  TH: {
    name: "TH", // th
    f1Range: [300, 500],
    f2Range: [1200, 2000],
    volumeThreshold: 0.06,
    blendShapeMapping: { I: 0.4, A: 0.3 },
  },
  DD: {
    name: "DD", // d, t
    f1Range: [200, 500],
    f2Range: [1400, 2200],
    volumeThreshold: 0.07,
    blendShapeMapping: { I: 0.6 },
  },

  // 子音（軟口蓋音）
  kk: {
    name: "kk", // k, g
    f1Range: [200, 400],
    f2Range: [800, 1600],
    volumeThreshold: 0.08,
    blendShapeMapping: { E: 0.5, A: 0.3 },
  },

  // 子音（摩擦音）
  CH: {
    name: "CH", // ch, j
    f1Range: [300, 600],
    f2Range: [1500, 2500],
    volumeThreshold: 0.09,
    blendShapeMapping: { I: 0.7, U: 0.3 },
  },
  SS: {
    name: "SS", // s, z
    f1Range: [200, 400],
    f2Range: [2000, 3000],
    volumeThreshold: 0.08,
    blendShapeMapping: { I: 0.8 },
  },

  // 子音（鼻音・流音）
  nn: {
    name: "nn", // n, m
    f1Range: [200, 500],
    f2Range: [1000, 1800],
    volumeThreshold: 0.06,
    blendShapeMapping: { A: 0.4, U: 0.2 },
  },
  RR: {
    name: "RR", // r, l
    f1Range: [300, 600],
    f2Range: [900, 1500],
    volumeThreshold: 0.07,
    blendShapeMapping: { E: 0.6, A: 0.2 },
  },
};

export class PhonemeAnalysisService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Float32Array | null = null;
  private isAnalyzing = false;
  private analysisCallback: ((result: PhonemeAnalysisResult) => void) | null =
    null;

  // 分析パラメータ
  private fftSize = 2048;
  private smoothingTimeConstant = 0.8;
  private minDecibels = -100;
  private maxDecibels = -30;

  // フォルマント検出用
  private sampleRate = 44100;
  private windowSize = 1024;

  /**
   * 音素解析を開始
   */
  async startAnalysis(
    stream: MediaStream,
    callback: (result: PhonemeAnalysisResult) => void
  ): Promise<void> {
    try {
      // AudioContextを作成
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      // AnalyserNodeを作成
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
      this.analyser.minDecibels = this.minDecibels;
      this.analyser.maxDecibels = this.maxDecibels;

      // MediaStreamSourceを作成
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      // データ配列を初期化
      this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
      this.sampleRate = this.audioContext.sampleRate;

      this.analysisCallback = callback;
      this.isAnalyzing = true;

      // 分析ループを開始
      this.startAnalysisLoop();

      console.log("音素解析開始");
    } catch (error) {
      console.error("音素解析開始エラー:", error);
      throw error;
    }
  }

  /**
   * 音素解析を停止
   */
  stopAnalysis(): void {
    this.isAnalyzing = false;
    this.analysisCallback = null;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;

    console.log("音素解析停止");
  }

  /**
   * 分析ループ
   */
  private startAnalysisLoop(): void {
    const analyze = (): void => {
      if (!this.isAnalyzing || !this.analyser || !this.dataArray) {
        return;
      }

      // 周波数データを取得
      this.analyser.getFloatFrequencyData(this.dataArray);

      // フォルマント解析
      const formants = this.extractFormants(this.dataArray);

      // 音量計算
      const volume = this.calculateVolume(this.dataArray);

      // 音素検出
      const phoneme = this.detectPhoneme(formants, volume);

      // 結果をコールバック
      if (this.analysisCallback) {
        const result: PhonemeAnalysisResult = {
          phoneme: phoneme.name,
          confidence: phoneme.confidence,
          formants: formants,
          volume: volume,
          timestamp: Date.now(),
        };

        this.analysisCallback(result);
      }

      // 次のフレームをスケジュール（60FPS）
      setTimeout(analyze, 1000 / 60);
    };

    analyze();
  }

  /**
   * フォルマント抽出
   */
  private extractFormants(frequencyData: Float32Array): {
    f1: number;
    f2: number;
    f3: number;
  } {
    const peaks = this.findSpectralPeaks(frequencyData);

    // 最初の3つのピークをフォルマントとして使用
    const f1 = peaks[0] || 0;
    const f2 = peaks[1] || 0;
    const f3 = peaks[2] || 0;

    return { f1, f2, f3 };
  }

  /**
   * スペクトルピーク検出
   */
  private findSpectralPeaks(frequencyData: Float32Array): number[] {
    const peaks: Array<{ frequency: number; magnitude: number }> = [];
    const binWidth = this.sampleRate / (2 * frequencyData.length);

    // ピーク検出（簡易版）
    for (let i = 1; i < frequencyData.length - 1; i++) {
      const current = frequencyData[i];
      const prev = frequencyData[i - 1];
      const next = frequencyData[i + 1];

      // ローカルマキシマを検出
      if (current > prev && current > next && current > -60) {
        // -60dB以上のピークのみ
        const frequency = i * binWidth;
        if (frequency >= 100 && frequency <= 4000) {
          // 音声の範囲内
          peaks.push({ frequency, magnitude: current });
        }
      }
    }

    // 強度順にソート
    peaks.sort((a, b) => b.magnitude - a.magnitude);

    // 周波数のみを返す
    return peaks.slice(0, 5).map((peak) => peak.frequency);
  }

  /**
   * 音量計算
   */
  private calculateVolume(frequencyData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // dBからリニアに変換
      sum += magnitude * magnitude;
    }
    return Math.sqrt(sum / frequencyData.length);
  }

  /**
   * 音素検出
   */
  private detectPhoneme(
    formants: { f1: number; f2: number; f3: number },
    volume: number
  ): { name: string; confidence: number } {
    let bestMatch = { name: "sil", confidence: 0 };

    // 音量が低い場合は無音
    if (volume < 0.01) {
      return { name: "sil", confidence: 1.0 };
    }

    // 各音素との一致度を計算
    for (const [phonemeName, config] of Object.entries(PHONEME_CONFIGS)) {
      if (phonemeName === "sil") continue;

      // 音量チェック
      if (volume < config.volumeThreshold) continue;

      // フォルマント一致度計算
      const f1Match = this.calculateFormantMatch(formants.f1, config.f1Range);
      const f2Match = this.calculateFormantMatch(formants.f2, config.f2Range);

      // 総合一致度
      const confidence = (f1Match + f2Match) / 2;

      if (confidence > bestMatch.confidence) {
        bestMatch = { name: phonemeName, confidence };
      }
    }

    return bestMatch;
  }

  /**
   * フォルマント一致度計算
   */
  private calculateFormantMatch(
    frequency: number,
    range: [number, number]
  ): number {
    const [min, max] = range;
    const center = (min + max) / 2;
    const tolerance = (max - min) / 2;

    if (frequency >= min && frequency <= max) {
      // 範囲内の場合、中心に近いほど高スコア
      const distance = Math.abs(frequency - center);
      return 1.0 - distance / tolerance;
    } else {
      // 範囲外の場合、距離に応じてスコア減少
      const distance = Math.min(
        Math.abs(frequency - min),
        Math.abs(frequency - max)
      );
      return Math.max(0, 1.0 - distance / tolerance);
    }
  }

  /**
   * 音素設定を取得
   */
  getPhonemeConfig(phoneme: string): PhonemeConfig | null {
    return PHONEME_CONFIGS[phoneme] || null;
  }

  /**
   * 利用可能な音素一覧を取得
   */
  getAvailablePhonemes(): string[] {
    return Object.keys(PHONEME_CONFIGS);
  }

  /**
   * 分析状態を取得
   */
  getAnalysisStatus(): {
    isAnalyzing: boolean;
    sampleRate: number;
    fftSize: number;
  } {
    return {
      isAnalyzing: this.isAnalyzing,
      sampleRate: this.sampleRate,
      fftSize: this.fftSize,
    };
  }
}

// シングルトンインスタンス
export const phonemeAnalysisService = new PhonemeAnalysisService();
