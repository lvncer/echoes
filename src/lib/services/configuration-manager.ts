/**
 * 統一設定管理サービス
 * 環境変数とストア設定を統合管理
 */

export interface AppConfiguration {
  ai: {
    defaultProvider: "openai" | "gemini";
    openai: {
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
    gemini: {
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
  };
  audio: {
    sampleRate: number;
    channelCount: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
  speech: {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    rate: number;
    pitch: number;
    volume: number;
  };
  animation: {
    emotionIntensity: number;
    gestureIntensity: number;
    autoAnimations: boolean;
    performanceMonitoring: boolean;
  };
}

class ConfigurationManagerService {
  private config: AppConfiguration;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): AppConfiguration {
    const defaultConfig: AppConfiguration = {
      ai: {
        defaultProvider: "gemini",
        openai: {
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          model: "gpt-4",
          maxTokens: 2000,
          temperature: 0.7,
        },
        gemini: {
          apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          model: "gemini-pro",
          maxTokens: 2000,
          temperature: 0.7,
        },
      },
      audio: {
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      speech: {
        language: "ja-JP",
        continuous: true,
        interimResults: true,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
      animation: {
        emotionIntensity: 1.0,
        gestureIntensity: 1.0,
        autoAnimations: true,
        performanceMonitoring: false,
      },
    };

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("echoes-configuration");
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          return this.mergeConfigurations(defaultConfig, parsedConfig);
        }
      } catch (error) {
        console.warn("Failed to load stored configuration:", error);
      }
    }

    return defaultConfig;
  }

  private mergeConfigurations(
    defaultConfig: AppConfiguration,
    storedConfig: Partial<AppConfiguration>,
  ): AppConfiguration {
    return {
      ai: { ...defaultConfig.ai, ...storedConfig.ai },
      audio: { ...defaultConfig.audio, ...storedConfig.audio },
      speech: { ...defaultConfig.speech, ...storedConfig.speech },
      animation: { ...defaultConfig.animation, ...storedConfig.animation },
    };
  }

  public getConfiguration(): AppConfiguration {
    return { ...this.config };
  }

  public updateConfiguration(updates: Partial<AppConfiguration>): void {
    this.config = this.mergeConfigurations(this.config, updates);
    this.saveConfiguration();
  }

  public getAIConfig() {
    return this.config.ai;
  }

  public getAudioConfig() {
    return this.config.audio;
  }

  public getSpeechConfig() {
    return this.config.speech;
  }

  public getAnimationConfig() {
    return this.config.animation;
  }

  private saveConfiguration(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("echoes-configuration", JSON.stringify(this.config));
      } catch (error) {
        console.warn("Failed to save configuration:", error);
      }
    }
  }

  public resetToDefaults(): void {
    this.config = this.loadConfiguration();
    if (typeof window !== "undefined") {
      localStorage.removeItem("echoes-configuration");
    }
  }
}

export const configurationManager = new ConfigurationManagerService();
