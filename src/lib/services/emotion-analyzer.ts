/**
 * 感情解析サービス
 * AI応答テキストから感情を自動判定し、アニメーション制御に活用
 */

export interface EmotionAnalysisResult {
  emotion: "neutral" | "happy" | "sad" | "angry" | "surprised";
  intensity: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  keywords: string[]; // 判定に使用されたキーワード
}

/**
 * 感情キーワード辞書
 */
const emotionKeywords = {
  happy: {
    primary: [
      "嬉しい",
      "楽しい",
      "幸せ",
      "喜び",
      "良い",
      "素晴らしい",
      "最高",
      "やったー",
      "ありがとう",
      "感謝",
      "笑",
      "笑顔",
      "ハッピー",
      "うれしい",
      "たのしい",
      "よかった",
      "すごい",
      "素敵",
      "いいね",
      "グッド",
      "ナイス",
      "完璧",
      "成功",
      "達成",
      "勝利",
      "おめでとう",
      "祝福",
      "満足",
      "充実",
    ],
    secondary: [
      "好き",
      "愛",
      "美しい",
      "綺麗",
      "可愛い",
      "面白い",
      "興味深い",
      "魅力的",
      "ポジティブ",
      "前向き",
      "明るい",
      "元気",
      "活気",
      "希望",
      "期待",
    ],
    intensity: 0.8,
  },
  sad: {
    primary: [
      "悲しい",
      "辛い",
      "苦しい",
      "痛い",
      "寂しい",
      "残念",
      "がっかり",
      "失望",
      "涙",
      "泣く",
      "悲しみ",
      "憂鬱",
      "落ち込む",
      "ショック",
      "絶望",
      "困った",
      "大変",
      "問題",
      "失敗",
      "負け",
      "敗北",
      "挫折",
    ],
    secondary: [
      "心配",
      "不安",
      "恐れ",
      "怖い",
      "暗い",
      "重い",
      "疲れた",
      "つらい",
      "ネガティブ",
      "後悔",
      "申し訳",
      "すみません",
      "ごめん",
      "謝罪",
    ],
    intensity: 0.7,
  },
  angry: {
    primary: [
      "怒り",
      "腹立つ",
      "ムカつく",
      "イライラ",
      "激怒",
      "憤慨",
      "不満",
      "抗議",
      "許せない",
      "ひどい",
      "最悪",
      "バカ",
      "アホ",
      "クソ",
      "ふざけるな",
      "やめろ",
      "うるさい",
      "邪魔",
      "迷惑",
      "腹が立つ",
    ],
    secondary: [
      "批判",
      "反対",
      "拒否",
      "嫌",
      "嫌い",
      "嫌悪",
      "軽蔑",
      "見下す",
      "文句",
      "苦情",
      "クレーム",
      "抗議",
      "反発",
      "敵意",
    ],
    intensity: 0.9,
  },
  surprised: {
    primary: [
      "驚き",
      "びっくり",
      "まさか",
      "信じられない",
      "本当に",
      "え？",
      "えー",
      "うそ",
      "嘘",
      "ありえない",
      "想像以上",
      "予想外",
      "意外",
      "突然",
      "急に",
      "いきなり",
      "なんと",
      "おお",
      "わあ",
      "すごい",
    ],
    secondary: [
      "初めて",
      "珍しい",
      "不思議",
      "謎",
      "疑問",
      "どうして",
      "なぜ",
      "理解できない",
      "混乱",
      "戸惑い",
      "困惑",
      "当惑",
    ],
    intensity: 0.6,
  },
};

/**
 * 感情解析クラス
 */
export class EmotionAnalyzer {
  private lastAnalysis: EmotionAnalysisResult | null = null;
  private analysisHistory: EmotionAnalysisResult[] = [];

  /**
   * テキストから感情を解析
   */
  public analyzeText(text: string): EmotionAnalysisResult {
    // テキストの前処理
    const normalizedText = this.normalizeText(text);

    // 各感情のスコアを計算
    const emotionScores = this.calculateEmotionScores(normalizedText);

    // 最も高いスコアの感情を選択
    const topEmotion = this.selectTopEmotion(emotionScores);

    // 強度と信頼度を計算
    const intensity = this.calculateIntensity(
      topEmotion,
      emotionScores,
      normalizedText
    );
    const confidence = this.calculateConfidence(topEmotion, emotionScores);

    // 使用されたキーワードを取得
    const keywords = this.getMatchedKeywords(
      normalizedText,
      topEmotion.emotion
    );

    const result: EmotionAnalysisResult = {
      emotion: topEmotion.emotion,
      intensity,
      confidence,
      keywords,
    };

    // 履歴に追加
    this.lastAnalysis = result;
    this.analysisHistory.push(result);
    if (this.analysisHistory.length > 10) {
      this.analysisHistory.shift();
    }

    console.log(
      `🎭 EmotionAnalyzer: ${result.emotion} (強度: ${result.intensity.toFixed(
        2
      )}, 信頼度: ${result.confidence.toFixed(2)})`
    );

    return result;
  }

  /**
   * テキストの正規化
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[！？。、]/g, "") // 句読点を除去
      .replace(/\s+/g, "") // 空白を除去
      .trim();
  }

  /**
   * 各感情のスコアを計算
   */
  private calculateEmotionScores(
    text: string
  ): Record<string, { score: number; matches: string[] }> {
    const scores: Record<string, { score: number; matches: string[] }> = {};

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      const matches: string[] = [];

      // プライマリキーワードのマッチング
      keywords.primary.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 2.0; // プライマリは高スコア
          matches.push(keyword);
        }
      });

      // セカンダリキーワードのマッチング
      keywords.secondary.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 1.0; // セカンダリは低スコア
          matches.push(keyword);
        }
      });

      scores[emotion] = { score, matches };
    });

    return scores;
  }

  /**
   * 最も高いスコアの感情を選択
   */
  private selectTopEmotion(
    scores: Record<string, { score: number; matches: string[] }>
  ): {
    emotion: "neutral" | "happy" | "sad" | "angry" | "surprised";
    score: number;
  } {
    let topEmotion: "neutral" | "happy" | "sad" | "angry" | "surprised" =
      "neutral";
    let topScore = 0;

    Object.entries(scores).forEach(([emotion, data]) => {
      if (data.score > topScore) {
        topScore = data.score;
        topEmotion = emotion as "happy" | "sad" | "angry" | "surprised";
      }
    });

    return { emotion: topEmotion, score: topScore };
  }

  /**
   * 感情強度を計算
   */
  private calculateIntensity(
    topEmotion: {
      emotion: "neutral" | "happy" | "sad" | "angry" | "surprised";
      score: number;
    },
    scores: Record<string, { score: number; matches: string[] }>,
    text: string
  ): number {
    if (topEmotion.emotion === "neutral" || topEmotion.score === 0) {
      return 0.3; // ニュートラルの基本強度
    }

    // 基本強度
    const baseIntensity =
      emotionKeywords[topEmotion.emotion as keyof typeof emotionKeywords]
        ?.intensity || 0.5;

    // スコアに基づく調整
    const scoreMultiplier = Math.min(topEmotion.score / 3.0, 1.0);

    // テキスト長による調整（長いテキストは感情が薄まる傾向）
    const lengthMultiplier = Math.max(0.5, 1.0 - text.length / 200);

    // 感嘆符や疑問符による強調
    const emphasisMultiplier = this.calculateEmphasisMultiplier(text);

    const intensity =
      baseIntensity * scoreMultiplier * lengthMultiplier * emphasisMultiplier;

    return Math.max(0.1, Math.min(1.0, intensity));
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(
    topEmotion: {
      emotion: "neutral" | "happy" | "sad" | "angry" | "surprised";
      score: number;
    },
    scores: Record<string, { score: number; matches: string[] }>
  ): number {
    if (topEmotion.score === 0) {
      return 0.8; // ニュートラルの信頼度
    }

    // 他の感情との差による信頼度
    const otherScores = Object.values(scores)
      .map((data) => data.score)
      .filter((score) => score !== topEmotion.score)
      .sort((a, b) => b - a);

    const secondHighest = otherScores[0] || 0;
    const scoreDifference = topEmotion.score - secondHighest;

    // スコア差が大きいほど信頼度が高い
    const confidence = Math.min(0.9, 0.5 + scoreDifference / 5.0);

    return Math.max(0.3, confidence);
  }

  /**
   * 強調表現による倍率を計算
   */
  private calculateEmphasisMultiplier(text: string): number {
    let multiplier = 1.0;

    // 感嘆符
    const exclamationCount = (text.match(/[！!]/g) || []).length;
    multiplier += exclamationCount * 0.1;

    // 疑問符
    const questionCount = (text.match(/[？?]/g) || []).length;
    multiplier += questionCount * 0.05;

    // 大文字（英語）
    const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
    multiplier += upperCaseCount * 0.02;

    // 繰り返し文字
    const repeatCount = (text.match(/(.)\1{2,}/g) || []).length;
    multiplier += repeatCount * 0.15;

    return Math.min(1.5, multiplier);
  }

  /**
   * マッチしたキーワードを取得
   */
  private getMatchedKeywords(text: string, emotion: string): string[] {
    if (emotion === "neutral") return [];

    const keywords = emotionKeywords[emotion as keyof typeof emotionKeywords];
    if (!keywords) return [];

    const matches: string[] = [];

    [...keywords.primary, ...keywords.secondary].forEach((keyword) => {
      if (text.includes(keyword)) {
        matches.push(keyword);
      }
    });

    return matches;
  }

  /**
   * 最後の解析結果を取得
   */
  public getLastAnalysis(): EmotionAnalysisResult | null {
    return this.lastAnalysis;
  }

  /**
   * 解析履歴を取得
   */
  public getAnalysisHistory(): EmotionAnalysisResult[] {
    return [...this.analysisHistory];
  }

  /**
   * 履歴をクリア
   */
  public clearHistory(): void {
    this.analysisHistory = [];
    this.lastAnalysis = null;
  }

  /**
   * コンテキストを考慮した感情解析
   * 前回の感情状態を考慮して、急激な変化を緩和
   */
  public analyzeWithContext(text: string): EmotionAnalysisResult {
    const currentAnalysis = this.analyzeText(text);

    if (!this.lastAnalysis || this.analysisHistory.length < 2) {
      return currentAnalysis;
    }

    // 前回の感情との差を計算
    const emotionChange = this.calculateEmotionChange(
      this.lastAnalysis,
      currentAnalysis
    );

    // 急激な変化の場合は強度を調整
    if (emotionChange > 0.7) {
      currentAnalysis.intensity *= 0.8; // 強度を少し下げる
      currentAnalysis.confidence *= 0.9; // 信頼度も少し下げる
    }

    return currentAnalysis;
  }

  /**
   * 感情変化の度合いを計算
   */
  private calculateEmotionChange(
    previous: EmotionAnalysisResult,
    current: EmotionAnalysisResult
  ): number {
    if (previous.emotion === current.emotion) {
      return Math.abs(previous.intensity - current.intensity);
    }

    // 異なる感情の場合は大きな変化とみなす
    return Math.max(previous.intensity, current.intensity);
  }
}

/**
 * シングルトンインスタンス
 */
export const emotionAnalyzer = new EmotionAnalyzer();
