import type {
  VoicevoxSpeaker,
  VoicevoxConfig,
  VoicevoxServerInfo,
  AudioQuery,
  VoicevoxError,
} from "@/lib/types/voicevox";
import { DEFAULT_VOICEVOX_CONFIG, VOICEVOX_WEB_API_CONFIG } from "@/lib/types/voicevox";

/**
 * VOICEVOX API クライアントサービス
 * ローカルVOICEVOXサーバーまたはWeb APIとの通信を管理
 */
export class VoicevoxService {
  private config: VoicevoxConfig;
  private isServerAvailable = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30秒
  private audioCache = new Map<string, Blob>();
  private maxCacheSize = 50; // 最大キャッシュ数

  constructor(config: Partial<VoicevoxConfig> = {}) {
    // Web API使用がデフォルト、未指定の場合はWeb API設定を使用
    const defaultConfig = config.useWebApi !== false ? VOICEVOX_WEB_API_CONFIG : DEFAULT_VOICEVOX_CONFIG;
    this.config = { ...defaultConfig, ...config };
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
      // Web API使用時はAPIキーが必要
      if (this.config.useWebApi && !this.config.apiKey) {
        this.isServerAvailable = false;
        return false;
      }

      // Web APIの場合は/speakers エンドポイントで確認（/versionが無い場合があるため）
      const endpoint = this.config.useWebApi ? "/speakers/" : "/version";
      const headers: Record<string, string> = {};
      
      // Web API使用時はAPIキーをヘッダーに追加
      if (this.config.useWebApi && this.config.apiKey) {
        headers["X-API-Key"] = this.config.apiKey;
      }

      const response = await fetch(`${this.config.serverUrl}${endpoint}`, {
        method: "GET",
        headers,
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
      // Web APIの場合は簡易的な情報を返す
      if (this.config.useWebApi) {
        return {
          version: "web-api",
          core_version: "web-api",
          supported_features: {
            adjust_mora_pitch: true,
            adjust_phoneme_length: true,
            adjust_speed_scale: true,
            adjust_pitch_scale: true,
            adjust_intonation_scale: true,
            adjust_volume_scale: true,
            interrogative_upspeak: true,
          },
        };
      }

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
      // Web API使用時はAPIキーが必要
      if (this.config.useWebApi && !this.config.apiKey) {
        throw new Error("Web API使用時はAPIキーが必要です。設定画面でAPIキーを入力してください。");
      }

      let url: string;
      const headers: Record<string, string> = {};

      if (this.config.useWebApi) {
        // Web API使用時はプロキシ経由でアクセス
        url = `/api/voicevox?endpoint=/speakers/`;
        headers["X-API-Key"] = this.config.apiKey!;
      } else {
        // ローカルAPI使用時は直接アクセス
        url = `${this.config.serverUrl}/speakers`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        try {
          const errorData: VoicevoxError = await response.json();
          const errorMessage = errorData.error || errorData.detail || errorData.errorMessage || "不明なエラー";
          
          if (errorMessage.includes("APIキー") || errorMessage === "invalidApiKey") {
            throw new Error("APIキーが無効です。正しいAPIキーを設定してください。");
          }
          
          throw new Error(`話者情報取得エラー: ${errorMessage}`);
        } catch (_parseError) {
          throw new Error(`話者情報取得エラー (HTTP ${response.status}): ${response.statusText}`);
        }
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
    // Web API使用時はAPIキーが必要
    if (this.config.useWebApi && !this.config.apiKey) {
      throw new Error("Web API使用時はAPIキーが必要です。設定画面でAPIキーを入力してください。");
    }

    let url: string;
    const headers: Record<string, string> = {};

    if (this.config.useWebApi) {
      // Web API使用時はプロキシ経由でアクセス
      const endpoint = `/audio_query/?text=${encodeURIComponent(text)}&speaker=${speakerId}`;
      url = `/api/voicevox?endpoint=${encodeURIComponent(endpoint)}`;
      headers["X-API-Key"] = this.config.apiKey!;
    } else {
      // ローカルAPI使用時は直接アクセス
      const localUrl = new URL(`${this.config.serverUrl}/audio_query`);
      localUrl.searchParams.set("text", text);
      localUrl.searchParams.set("speaker", speakerId.toString());
      url = localUrl.toString();
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      try {
        const errorData: VoicevoxError = await response.json();
        const errorMessage = errorData.error || errorData.detail || errorData.errorMessage || "不明なエラー";
        
        if (errorMessage.includes("APIキー") || errorMessage === "invalidApiKey") {
          throw new Error("APIキーが無効です。正しいAPIキーを設定してください。");
        }
        
        throw new Error(`AudioQuery作成エラー: ${errorMessage}`);
              } catch (_parseError) {
          throw new Error(`AudioQuery作成エラー (HTTP ${response.status}): ${response.statusText}`);
        }
    }

    return await response.json();
  }

  /**
   * AudioQueryから音声を合成
   */
  private async synthesizeFromQuery(audioQuery: AudioQuery, speakerId: number): Promise<Blob> {
    // Web API使用時はAPIキーが必要
    if (this.config.useWebApi && !this.config.apiKey) {
      throw new Error("Web API使用時はAPIキーが必要です。設定画面でAPIキーを入力してください。");
    }

    let url: string;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.useWebApi) {
      // Web API使用時はプロキシ経由でアクセス
      const endpoint = `/synthesis/?speaker=${speakerId}`;
      url = `/api/voicevox?endpoint=${encodeURIComponent(endpoint)}`;
      headers["X-API-Key"] = this.config.apiKey!;
    } else {
      // ローカルAPI使用時は直接アクセス
      const localUrl = new URL(`${this.config.serverUrl}/synthesis`);
      localUrl.searchParams.set("speaker", speakerId.toString());
      url = localUrl.toString();
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(audioQuery),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      try {
        const errorData: VoicevoxError = await response.json();
        const errorMessage = errorData.error || errorData.detail || errorData.errorMessage || "不明なエラー";
        
        if (errorMessage.includes("APIキー") || errorMessage === "invalidApiKey") {
          throw new Error("APIキーが無効です。正しいAPIキーを設定してください。");
        }
        
        throw new Error(`音声合成エラー: ${errorMessage}`);
              } catch (_parseError) {
          throw new Error(`音声合成エラー (HTTP ${response.status}): ${response.statusText}`);
        }
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