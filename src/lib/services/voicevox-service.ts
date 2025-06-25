import type {
  VoicevoxSpeaker,
  VoicevoxConfig,
  VoicevoxServerInfo,
  AudioQuery,
  VoicevoxError,
} from "@/lib/types/voicevox";
import { DEFAULT_VOICEVOX_CONFIG } from "@/lib/types/voicevox";

/**
 * VOICEVOX API クライアントサービス
 * ローカルVOICEVOXサーバーとの通信を管理
 */
export class VoicevoxService {
  private config: VoicevoxConfig;
  private isServerAvailable = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30秒
  private audioCache = new Map<string, Blob>();
  private maxCacheSize = 50; // 最大キャッシュ数

  constructor(config: Partial<VoicevoxConfig> = {}) {
    this.config = { ...DEFAULT_VOICEVOX_CONFIG, ...config };
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<VoicevoxConfig>): void {
    this.config = { ...this.config, ...config };
    // 設定変更時はサーバー状態を再確認
    this.isServerAvailable = false;
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): VoicevoxConfig {
    return { ...this.config };
  }

  /**
   * VOICEVOXサーバーの状態確認
   */
  async checkServerStatus(): Promise<boolean> {
    const now = Date.now();
    
    // 最近チェックした場合はキャッシュを使用
    if (this.isServerAvailable && now - this.lastHealthCheck < this.healthCheckInterval) {
      return true;
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/version`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (response.ok) {
        this.isServerAvailable = true;
        this.lastHealthCheck = now;
        return true;
      } else {
        this.isServerAvailable = false;
        return false;
      }
    } catch (error) {
      console.warn("VOICEVOX サーバー接続エラー:", error);
      this.isServerAvailable = false;
      return false;
    }
  }

  /**
   * サーバー情報を取得
   */
  async getServerInfo(): Promise<VoicevoxServerInfo | null> {
    try {
      const response = await fetch(`${this.config.serverUrl}/version`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("サーバー情報取得エラー:", error);
      return null;
    }
  }

  /**
   * 利用可能な話者一覧を取得
   */
  async getSpeakers(): Promise<VoicevoxSpeaker[]> {
    try {
      const response = await fetch(`${this.config.serverUrl}/speakers`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData: VoicevoxError = await response.json();
        throw new Error(`話者情報取得エラー: ${errorData.detail}`);
      }

      return await response.json();
    } catch (error) {
      console.error("話者一覧取得エラー:", error);
      throw new Error(`話者一覧の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
    }
  }

  /**
   * 音声合成を実行
   */
  async synthesizeVoice(text: string, speakerId?: number): Promise<Blob> {
    if (!text || text.trim().length === 0) {
      throw new Error("テキストが空です");
    }

    const targetSpeaker = speakerId ?? this.config.speaker;
    const cacheKey = `${text}_${targetSpeaker}`;

    // キャッシュをチェック
    if (this.audioCache.has(cacheKey)) {
      const cachedAudio = this.audioCache.get(cacheKey)!;
      console.log("音声キャッシュヒット:", text.substring(0, 20));
      return cachedAudio;
    }

    try {
      // 1. AudioQuery作成
      const audioQuery = await this.createAudioQuery(text, targetSpeaker);

      // 2. 音声合成実行
      const audioBlob = await this.synthesizeFromQuery(audioQuery, targetSpeaker);

      // 3. キャッシュに保存
      this.addToCache(cacheKey, audioBlob);

      return audioBlob;
    } catch (error) {
      console.error("音声合成エラー:", error);
      throw new Error(`音声合成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
    }
  }

  /**
   * AudioQueryを作成
   */
  private async createAudioQuery(text: string, speakerId: number): Promise<AudioQuery> {
    const url = new URL(`${this.config.serverUrl}/audio_query`);
    url.searchParams.set("text", text);
    url.searchParams.set("speaker", speakerId.toString());

    const response = await fetch(url.toString(), {
      method: "POST",
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorData: VoicevoxError = await response.json();
      throw new Error(`AudioQuery作成エラー: ${errorData.detail}`);
    }

    return await response.json();
  }

  /**
   * AudioQueryから音声を合成
   */
  private async synthesizeFromQuery(audioQuery: AudioQuery, speakerId: number): Promise<Blob> {
    const url = new URL(`${this.config.serverUrl}/synthesis`);
    url.searchParams.set("speaker", speakerId.toString());

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(audioQuery),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorData: VoicevoxError = await response.json();
      throw new Error(`音声合成エラー: ${errorData.detail}`);
    }

    return await response.blob();
  }

  /**
   * キャッシュに音声データを追加
   */
  private addToCache(key: string, audioBlob: Blob): void {
    // キャッシュサイズ制限
    if (this.audioCache.size >= this.maxCacheSize) {
      // 最も古いエントリを削除（FIFO）
      const firstKey = this.audioCache.keys().next().value;
      if (firstKey) {
        this.audioCache.delete(firstKey);
      }
    }

    this.audioCache.set(key, audioBlob);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * キャッシュ情報を取得
   */
  getCacheInfo(): { size: number; maxSize: number } {
    return {
      size: this.audioCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * 指定したテキストの音声がキャッシュにあるかチェック
   */
  isCached(text: string, speakerId?: number): boolean {
    const targetSpeaker = speakerId ?? this.config.speaker;
    const cacheKey = `${text}_${targetSpeaker}`;
    return this.audioCache.has(cacheKey);
  }

  /**
   * 接続テスト（設定画面用）
   */
  async testConnection(): Promise<{
    success: boolean;
    serverInfo?: VoicevoxServerInfo;
    error?: string;
  }> {
    try {
      const isAvailable = await this.checkServerStatus();
      
      if (!isAvailable) {
        return {
          success: false,
          error: "VOICEVOXサーバーに接続できません",
        };
      }

      const serverInfo = await this.getServerInfo();
      
      if (!serverInfo) {
        return {
          success: false,
          error: "サーバー情報を取得できません",
        };
      }

      return {
        success: true,
        serverInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー",
      };
    }
  }

  /**
   * 簡単な音声合成テスト
   */
  async testSynthesis(): Promise<{ success: boolean; error?: string }> {
    try {
      const testText = "こんにちは";
      await this.synthesizeVoice(testText);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "音声合成テストに失敗しました",
      };
    }
  }

  /**
   * リソースクリーンアップ
   */
  cleanup(): void {
    this.clearCache();
    this.isServerAvailable = false;
    this.lastHealthCheck = 0;
  }
}

// デフォルトインスタンス
export const voicevoxService = new VoicevoxService(); 