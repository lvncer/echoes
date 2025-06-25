import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VoicevoxConfig } from "@/lib/types/voicevox";
import type { SpeechSynthesisConfig } from "@/lib/types/audio";

export type VoiceEngine = "webspeech" | "voicevox";

export interface VoiceSettings {
  // 音声エンジン選択
  engine: VoiceEngine;
  
  // VOICEVOX設定
  voicevox: VoicevoxConfig;
  
  // Web Speech API設定
  webspeech: SpeechSynthesisConfig;
  
  // 共通設定
  autoFallback: boolean;
  showVoiceCredits: boolean;
}

export interface VoiceSettingsState {
  settings: VoiceSettings;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  updateEngine: (engine: VoiceEngine) => void;
  updateVoicevoxConfig: (config: Partial<VoicevoxConfig>) => void;
  updateWebSpeechConfig: (config: Partial<SpeechSynthesisConfig>) => void;
  updateGeneralSettings: (settings: { autoFallback?: boolean; showVoiceCredits?: boolean }) => void;
  resetToDefaults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  engine: "webspeech",
  voicevox: {
    serverUrl: "http://localhost:50021",
    speaker: 3, // ずんだもん（ノーマル）
    autoFallback: true,
    timeout: 10000,
  },
  webspeech: {
    voice: undefined,
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: "ja-JP",
  },
  autoFallback: true,
  showVoiceCredits: true,
};

export const useVoiceSettingsStore = create<VoiceSettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_VOICE_SETTINGS,
      isLoading: false,
      error: null,

      updateEngine: (engine: VoiceEngine) => {
        set((state) => ({
          settings: {
            ...state.settings,
            engine,
          },
          error: null,
        }));
      },

      updateVoicevoxConfig: (config: Partial<VoicevoxConfig>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            voicevox: {
              ...state.settings.voicevox,
              ...config,
            },
          },
          error: null,
        }));
      },

      updateWebSpeechConfig: (config: Partial<SpeechSynthesisConfig>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            webspeech: {
              ...state.settings.webspeech,
              ...config,
            },
          },
          error: null,
        }));
      },

      updateGeneralSettings: (generalSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...generalSettings,
          },
          error: null,
        }));
      },

      resetToDefaults: () => {
        set({
          settings: DEFAULT_VOICE_SETTINGS,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: "voice-settings",
      version: 1,
      // 設定の一部のみを永続化（関数は除外）
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// 設定を取得するヘルパー関数
export const getVoiceSettings = (): VoiceSettings => {
  return useVoiceSettingsStore.getState().settings;
};

// 現在の音声エンジンを取得
export const getCurrentVoiceEngine = (): VoiceEngine => {
  return useVoiceSettingsStore.getState().settings.engine;
};

// VOICEVOX設定を取得
export const getVoicevoxConfig = (): VoicevoxConfig => {
  return useVoiceSettingsStore.getState().settings.voicevox;
};

// Web Speech API設定を取得
export const getWebSpeechConfig = (): SpeechSynthesisConfig => {
  return useVoiceSettingsStore.getState().settings.webspeech;
}; 