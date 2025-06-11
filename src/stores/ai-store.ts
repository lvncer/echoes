import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AISettings, AIProviderConfig, ChatMessage } from '../lib/types/ai';
import { createAIConfigFromEnv, DEFAULT_AI_CONFIG } from '../lib/config/env';
import { AIService } from '../lib/services/ai';

/**
 * AI ストアの状態
 */
interface AIStore {
  // 設定
  settings: AISettings;
  
  // サービス
  aiService: AIService | null;
  
  // チャット
  messages: ChatMessage[];
  isLoading: boolean;
  
  // アクション
  updateProviderConfig: (provider: keyof AISettings['providers'], config: Partial<AIProviderConfig>) => void;
  switchProvider: (provider: keyof AISettings['providers']) => void;
  initializeFromEnv: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  testConnection: () => Promise<boolean>;
  getAvailableModels: () => Promise<string[]>;
}

/**
 * デフォルトの AI 設定
 */
const createDefaultSettings = (): AISettings => {
  const envConfig = createAIConfigFromEnv();
  
  return {
    currentProvider: envConfig,
    providers: {
      openai: {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        ...envConfig,
      },
      anthropic: {
        provider: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
        temperature: 0.7,
      },
      local: {
        provider: 'local',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        maxTokens: 1000,
        temperature: 0.7,
      },
    },
  };
};

/**
 * AI ストア
 */
export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      settings: createDefaultSettings(),
      aiService: null,
      messages: [],
      isLoading: false,

      // プロバイダー設定を更新
      updateProviderConfig: (provider, config) => {
        set((state) => {
          const newSettings = {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [provider]: {
                ...state.settings.providers[provider],
                ...config,
              },
            },
          };

          // 現在のプロバイダーが更新された場合、currentProviderも更新
          if (provider === state.settings.currentProvider.provider) {
            newSettings.currentProvider = newSettings.providers[provider];
          }

          return {
            settings: newSettings,
            aiService: new AIService(newSettings.currentProvider),
          };
        });
      },

      // プロバイダーを切り替え
      switchProvider: (provider) => {
        set((state) => {
          const newCurrentProvider = state.settings.providers[provider];
          const newSettings = {
            ...state.settings,
            currentProvider: newCurrentProvider,
          };

          return {
            settings: newSettings,
            aiService: new AIService(newCurrentProvider),
          };
        });
      },

      // 環境変数から初期化
      initializeFromEnv: () => {
        set(() => {
          const settings = createDefaultSettings();
          return {
            settings,
            aiService: new AIService(settings.currentProvider),
          };
        });
      },

      // メッセージを送信
      sendMessage: async (content: string) => {
        const { aiService, messages } = get();
        
        if (!aiService) {
          console.error('AI サービスが初期化されていません');
          return;
        }

        // ユーザーメッセージを追加
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
        }));

        try {
          // AI 応答を生成
          const response = await aiService.generateResponse({
            messages: [...messages, userMessage],
          });

          // AI メッセージを追加
          set((state) => ({
            messages: [...state.messages, response.message],
            isLoading: false,
          }));

        } catch (error) {
          console.error('AI 応答生成エラー:', error);
          
          // エラーメッセージを追加
          const errorMessage: ChatMessage = {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: 'エラーが発生しました。設定を確認してください。',
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
          }));
        }
      },

      // メッセージをクリア
      clearMessages: () => {
        set({ messages: [] });
      },

      // 接続テスト
      testConnection: async () => {
        const { aiService } = get();
        if (!aiService) return false;
        
        try {
          return await aiService.testConnection();
        } catch (error) {
          console.error('接続テストエラー:', error);
          return false;
        }
      },

      // 利用可能なモデル一覧を取得
      getAvailableModels: async () => {
        const { aiService } = get();
        if (!aiService) return [];
        
        try {
          return await aiService.getAvailableModels();
        } catch (error) {
          console.error('モデル一覧取得エラー:', error);
          return [];
        }
      },
    }),
    {
      name: 'ai-settings',
      partialize: (state) => ({
        settings: state.settings,
        messages: state.messages,
      }),
    }
  )
);

/**
 * AI ストアを初期化
 */
export const initializeAIStore = () => {
  const store = useAIStore.getState();
  store.initializeFromEnv();
}; 