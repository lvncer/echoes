import { SpeechSynthesisService } from "./speech-synthesis";
import { VoicevoxService } from "./voicevox-service";
import {
  useVoiceSettingsStore,
  getCurrentVoiceEngine,
  getVoicevoxConfig,
  type VoiceEngine
} from "@/lib/stores/voice-settings-store";
import { getRequiredCredit } from "@/lib/types/voicevox";
import { AnimationController } from "./animation-controller";
import type { AudioEvents, AudioProcessingState } from "@/lib/types/audio";

export interface EngineStatus {
  webspeech: {
    available: boolean;
    error?: string;
  };
  voicevox: {
    available: boolean;
    serverRunning: boolean;
    error?: string;
  };
}

/**
 * 統合音声合成サービス
 * Web Speech APIとVOICEVOXを統合し、設定に応じて適切なエンジンを使用
 */
export class IntegratedSpeechService {
  private webSpeechService: SpeechSynthesisService;
  private voicevoxService: VoicevoxService;
  private currentAudioElement: HTMLAudioElement | null = null;
  private events: Partial<AudioEvents> = {};
  private animationController: AnimationController | null = null;

  constructor() {
    this.webSpeechService = new SpeechSynthesisService();
    
    // 初期設定でVOICEVOXサービスを作成
    const initialConfig = getVoicevoxConfig();
    this.voicevoxService = new VoicevoxService(initialConfig);
    
    // 設定変更の監視
    this.setupSettingsListener();
  }

  /**
   * 設定変更を監視してサービスを更新
   */
  private setupSettingsListener(): void {
    // Zustandストアの変更を監視
    useVoiceSettingsStore.subscribe((state) => {
      // VOICEVOX設定が変更された場合
      this.voicevoxService.updateConfig(state.settings.voicevox);
      
      // Web Speech API設定が変更された場合
      this.webSpeechService.updateConfig(state.settings.webspeech);
    });
  }

  /**
   * イベントリスナーを設定
   */
  public setEventListeners(events: Partial<AudioEvents>): void {
    this.events = { ...this.events, ...events };
    
    // 各サービスにもイベントを設定
    this.webSpeechService.setEventListeners(events);
  }

  /**
   * アニメーションコントローラーを設定
   */
  public setAnimationController(controller: AnimationController): void {
    console.log('[IntegratedSpeechService] アニメーションコントローラーを設定:', controller);
    this.animationController = controller;
  }

  /**
   * テキストを音声で読み上げ
   */
  public async speak(text: string): Promise<boolean> {
    if (!text || text.trim().length === 0) {
      return false;
    }

    const engine = getCurrentVoiceEngine();
    const settings = useVoiceSettingsStore.getState().settings;

    try {
      // 現在の音声を停止
      this.stop();

      if (engine === "voicevox") {
        return await this.speakWithVoicevox(text);
      } else {
        return await this.speakWithWebSpeech(text);
      }
    } catch (error) {
      console.error("音声合成エラー:", error);
      
      // 自動フォールバックが有効な場合
      if (settings.autoFallback && engine === "voicevox") {
        console.log("VOICEVOXエラーのため、Web Speech APIにフォールバック");
        return await this.speakWithWebSpeech(text);
      }

      // エラーイベントを発火
      this.events.onError?.(
        error instanceof Error ? error.message : "音声合成エラー"
      );

      return false;
    }
  }

  /**
   * VOICEVOXで音声合成
   */
  private async speakWithVoicevox(text: string): Promise<boolean> {
    try {
      const config = getVoicevoxConfig();

      // Web API使用時はサーバー状態チェックをスキップ
      if (!config.useWebApi) {
        // ローカルAPI使用時のみサーバー状態確認
        const isServerAvailable = await this.voicevoxService.checkServerStatus();
        if (!isServerAvailable) {
          throw new Error("VOICEVOXサーバーが利用できません");
        }
      }

      // 開始イベント
      this.events.onStart?.();
      
      // アニメーション制御：音声合成開始
      console.log('[IntegratedSpeechService] VOICEVOX音声合成開始 - アニメーション制御を呼び出し');
      this.animationController?.setSpeaking(true);
      
      // 音声合成実行
      const audioBlob = await this.voicevoxService.synthesizeVoice(text, config.speaker);
      
      // 音声再生
      const success = await this.playAudioBlob(audioBlob);

      // クレジット表示
      if (useVoiceSettingsStore.getState().settings.showVoiceCredits) {
        const credit = getRequiredCredit(config.speaker);
        console.log(`音声合成: ${credit}`);
      }

      return success;
    } catch (error) {
      console.error("VOICEVOX音声合成エラー:", error);
      throw error;
    }
  }

  /**
   * Web Speech APIで音声合成
   */
  private async speakWithWebSpeech(text: string): Promise<boolean> {
    // アニメーション制御：音声合成開始
    console.log('[IntegratedSpeechService] Web Speech API音声合成開始 - アニメーション制御を呼び出し');
    this.animationController?.setSpeaking(true);
    
    try {
      const result = await this.webSpeechService.speak(text);
      
      // アニメーション制御：音声合成終了
      console.log('[IntegratedSpeechService] Web Speech API音声合成完了 - アニメーション制御を呼び出し');
      this.animationController?.setSpeaking(false);
      
      return result;
    } catch (error) {
      // エラー時も音声合成終了を通知
      console.log('[IntegratedSpeechService] Web Speech APIエラー時 - アニメーション制御を呼び出し');
      this.animationController?.setSpeaking(false);
      throw error;
    }
  }

  /**
   * 音声Blobを再生
   */
  private async playAudioBlob(audioBlob: Blob): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // 音声要素を作成
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudioElement = new Audio(audioUrl);

        // イベントリスナーを設定
        this.currentAudioElement.onloadeddata = () => {
          this.events.onAudioReady?.(this.currentAudioElement!);
        };

        this.currentAudioElement.onplay = () => {
          this.events.onSpeakStart?.();
        };

        this.currentAudioElement.onended = () => {
          this.events.onSpeakEnd?.();
          
          // アニメーション制御：音声合成終了
          console.log('[IntegratedSpeechService] VOICEVOX音声再生完了 - アニメーション制御を呼び出し');
          this.animationController?.setSpeaking(false);
          
          URL.revokeObjectURL(audioUrl);
          this.currentAudioElement = null;
          resolve(true);
        };

        this.currentAudioElement.onerror = (error) => {
          console.error("音声再生エラー:", error);
          
          // アニメーション制御：エラー時も音声合成終了
          console.log('[IntegratedSpeechService] VOICEVOX音声再生エラー - アニメーション制御を呼び出し');
          this.animationController?.setSpeaking(false);
          
          URL.revokeObjectURL(audioUrl);
          this.currentAudioElement = null;
          reject(new Error("音声再生に失敗しました"));
        };

        // 再生開始
        this.currentAudioElement.play().catch((error) => {
          console.error("音声再生開始エラー:", error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudioElement = null;
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 音声を停止
   */
  public stop(): void {
    // VOICEVOX音声を停止
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }

    // Web Speech API音声を停止
    this.webSpeechService.stop();
    
    // アニメーション制御：音声合成終了
    console.log('[IntegratedSpeechService] 音声停止時 - アニメーション制御を呼び出し');
    this.animationController?.setSpeaking(false);
  }

  /**
   * 音声を一時停止
   */
  public pause(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    } else {
      this.webSpeechService.pause();
    }
  }

  /**
   * 音声を再開
   */
  public resume(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.play().catch(console.error);
    } else {
      this.webSpeechService.resume();
    }
  }

  /**
   * 現在音声が再生中かどうか
   */
  public isSpeaking(): boolean {
    if (this.currentAudioElement) {
      return !this.currentAudioElement.paused;
    }
    return this.webSpeechService.isSpeaking();
  }

  /**
   * 現在音声が一時停止中かどうか
   */
  public isPaused(): boolean {
    if (this.currentAudioElement) {
      return this.currentAudioElement.paused;
    }
    return this.webSpeechService.isPaused();
  }

  /**
   * 現在の音声要素を取得（リップシンク用）
   */
  public getCurrentAudioElement(): HTMLAudioElement | null {
    return this.currentAudioElement;
  }

  /**
   * 音声エンジンを切り替え
   */
  public switchEngine(engine: VoiceEngine): void {
    // 現在の音声を停止
    this.stop();
    
    // 設定を更新
    useVoiceSettingsStore.getState().updateEngine(engine);
  }

  /**
   * 各エンジンの利用可能性をテスト
   */
  public async testEngineAvailability(): Promise<EngineStatus> {
    const config = getVoicevoxConfig();
    
    const status: EngineStatus = {
      webspeech: {
        available: false,
      },
      voicevox: {
        available: false,
        serverRunning: false,
      },
    };

    // Web Speech APIテスト
    try {
      status.webspeech.available = this.webSpeechService.isSynthesisSupported();
    } catch (error) {
      status.webspeech.error = error instanceof Error ? error.message : "不明なエラー";
    }

    // VOICEVOXテスト
    try {
      if (config.useWebApi) {
        // Web API使用時: APIキーがあれば利用可能とみなす
        if (config.apiKey && config.apiKey.trim()) {
          status.voicevox.available = true;
          status.voicevox.serverRunning = true; // Web APIは常に稼働とみなす
        } else {
          status.voicevox.available = false;
          status.voicevox.serverRunning = true; // Web APIは稼働しているがAPIキーが必要
          status.voicevox.error = "APIキーが設定されていません";
        }
      } else {
        // ローカルAPI使用時: 従来通りのテスト
        const connectionTest = await this.voicevoxService.testConnection();
        status.voicevox.serverRunning = connectionTest.success;
        
        if (connectionTest.success) {
          const synthesisTest = await this.voicevoxService.testSynthesis();
          status.voicevox.available = synthesisTest.success;
          if (!synthesisTest.success) {
            status.voicevox.error = synthesisTest.error;
          }
        } else {
          status.voicevox.error = connectionTest.error;
        }
      }
    } catch (error) {
      status.voicevox.error = error instanceof Error ? error.message : "不明なエラー";
    }

    return status;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): AudioProcessingState {
    const engine = getCurrentVoiceEngine();
    
    if (engine === "voicevox" && this.currentAudioElement) {
      return {
        isRecording: false,
        isListening: false,
        isSpeaking: !this.currentAudioElement.paused,
        audioLevel: 0,
        error: null,
      };
    }

    return this.webSpeechService.getState();
  }

  /**
   * VOICEVOX話者一覧を取得
   */
  public async getVoicevoxSpeakers() {
    try {
      return await this.voicevoxService.getSpeakers();
    } catch (error) {
      console.error("VOICEVOX話者一覧取得エラー:", error);
      
      // APIキー関連のエラーの場合は詳細なエラーメッセージを返す
      if (error instanceof Error && error.message.includes("APIキー")) {
        throw error; // そのまま再スロー
      }
      
      // その他のエラーは一般的なメッセージに変換
      throw new Error("VOICEVOX話者一覧の取得に失敗しました。設定を確認してください。");
    }
  }

  /**
   * VOICEVOXキャッシュ情報を取得
   */
  public getVoicevoxCacheInfo() {
    return this.voicevoxService.getCacheInfo();
  }

  /**
   * VOICEVOXキャッシュをクリア
   */
  public clearVoicevoxCache(): void {
    this.voicevoxService.clearCache();
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.stop();
    this.webSpeechService.cleanup();
    this.voicevoxService.cleanup();
  }
}

// デフォルトインスタンス
export const integratedSpeechService = new IntegratedSpeechService(); 