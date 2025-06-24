import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Model3D,
  ModelDisplayState,
  ModelLoadResult,
  SceneConfig,
  CameraControlsConfig,
  AnimationState,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_ANIMATION_STATE,
} from "@/lib/types/3d";
import { loadModel } from "@/lib/3d/loaders";

interface ModelStore extends ModelDisplayState {
  // アクション
  setCurrentModel: (model: Model3D | undefined) => void;
  addModel: (model: Model3D) => void;
  removeModel: (modelId: string) => void;
  updateModel: (modelId: string, updates: Partial<Model3D>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  updateSceneConfig: (config: Partial<SceneConfig>) => void;
  updateCameraConfig: (config: Partial<CameraControlsConfig>) => void;
  updateAnimationState: (state: Partial<AnimationState>) => void;
  resetToDefaults: () => void;

  // モデル操作
  loadModelFromFile: (file: File) => Promise<ModelLoadResult>;
  switchToModel: (modelId: string) => void;
  getModelById: (modelId: string) => Model3D | undefined;

  // デフォルトモデル
  loadDefaultModel: () => Promise<void>;
  initializeDefaultModel: () => Promise<void>;

  // アニメーション制御
  playAnimation: (animationName?: string) => void;
  pauseAnimation: () => void;
  stopAnimation: () => void;
  setAnimationSpeed: (speed: number) => void;
  toggleAnimationLoop: () => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      currentModel: undefined,
      availableModels: [],
      isLoading: false,
      error: undefined,
      sceneConfig: DEFAULT_SCENE_CONFIG,
      cameraConfig: DEFAULT_CAMERA_CONFIG,
      animationState: DEFAULT_ANIMATION_STATE,

      // 基本アクション
      setCurrentModel: (model) => set({ currentModel: model }),

      addModel: (model) =>
        set((state) => {
          // 重複チェック: 同じIDまたはデフォルトモデルの重複を防ぐ
          const existingModel = state.availableModels.find(
            (m) => 
              m.id === model.id || 
              (m.isDefault && model.isDefault) ||
              // 同じファイル名かつサイズが同じ場合も重複とみなす
              (m.name === model.name && m.size === model.size && m.format === model.format)
          );
          
          if (existingModel) {
            console.log(`モデルの重複を検出: ${model.name} (ID: ${model.id})`);
            // 既存モデルの最終使用日時を更新
            const updatedModels = state.availableModels.map((m) =>
              m.id === existingModel.id ? { ...m, lastUsed: new Date() } : m
            );
            return { ...state, availableModels: updatedModels };
          }

          return {
            availableModels: [...state.availableModels, model],
          };
        }),

      removeModel: (modelId) =>
        set((state) => ({
          availableModels: state.availableModels.filter(
            (m) => m.id !== modelId
          ),
          currentModel:
            state.currentModel?.id === modelId ? undefined : state.currentModel,
        })),

      updateModel: (modelId, updates) =>
        set((state) => ({
          availableModels: state.availableModels.map((m) =>
            m.id === modelId ? { ...m, ...updates } : m
          ),
          currentModel:
            state.currentModel?.id === modelId
              ? { ...state.currentModel, ...updates }
              : state.currentModel,
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      updateSceneConfig: (config) =>
        set((state) => ({
          sceneConfig: { ...state.sceneConfig, ...config },
        })),

      updateCameraConfig: (config) =>
        set((state) => ({
          cameraConfig: { ...state.cameraConfig, ...config },
        })),

      updateAnimationState: (animationState) =>
        set((state) => ({
          animationState: { ...state.animationState, ...animationState },
        })),

      resetToDefaults: () =>
        set({
          sceneConfig: DEFAULT_SCENE_CONFIG,
          cameraConfig: DEFAULT_CAMERA_CONFIG,
          animationState: DEFAULT_ANIMATION_STATE,
        }),

      // モデル操作
      loadModelFromFile: async (file: File): Promise<ModelLoadResult> => {
        set({ isLoading: true, error: undefined });

        try {
          // ファイル形式の判定
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (!extension || !["vrm", "gltf", "glb"].includes(extension)) {
            throw new Error(
              "サポートされていないファイル形式です。VRM、glTF、GLBファイルを選択してください。"
            );
          }

          // 基本的なモデル情報を作成
          const modelInfo: Partial<Model3D> = {
            id: `model_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            format: extension as "vrm" | "gltf" | "glb",
            size: file.size,
            file,
            createdAt: new Date(),
          };

          // 実際のモデル読み込みは3Dローダーサービスで行う
          // ここでは基本情報のみ作成
          const model = modelInfo as Model3D;

          // ストアに追加
          get().addModel(model);

          set({ isLoading: false });
          return { success: true, model };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "不明なエラーが発生しました";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      switchToModel: (modelId) => {
        const model = get().getModelById(modelId);
        if (model) {
          set({
            currentModel: model,
            error: undefined,
          });

          // 最終使用日時を更新
          get().updateModel(modelId, { lastUsed: new Date() });
        }
      },

      getModelById: (modelId) => {
        return get().availableModels.find((m) => m.id === modelId);
      },

      // デフォルトモデル読み込み
      loadDefaultModel: async () => {
        try {
          const state = get();
          
          // デフォルトモデルが既に存在するかチェック
          const existingDefaultModel = state.availableModels.find(
            (model) => model.isDefault
          );
          
          if (existingDefaultModel) {
            console.log("デフォルトモデルは既に読み込まれています");
            // 既存のデフォルトモデルを現在のモデルとして設定
            get().setCurrentModel(existingDefaultModel);
            return;
          }

          set({ isLoading: true, error: undefined });

          // デフォルトモデルのパス
          const defaultModelPath = "/models/test/AliciaSolid.vrm";

          // ファイルをfetchで取得
          const response = await fetch(defaultModelPath);
          if (!response.ok) {
            throw new Error(
              `デフォルトモデルの読み込みに失敗しました: ${response.status}`
            );
          }

          // Blobからファイルオブジェクトを作成
          const blob = await response.blob();
          const file = new File([blob], "AliciaSolid.vrm", {
            type: "application/octet-stream",
          });

          // モデルを読み込み
          const result = await loadModel(file);

          if (result.success && result.model) {
            // デフォルトモデルとしてマーク
            const defaultModel = {
              ...result.model,
              name: "ニコニ立体ちゃん（デフォルト）",
              isDefault: true,
            };

            // ストアに追加（重複チェック付き）
            get().addModel(defaultModel);
            get().setCurrentModel(defaultModel);

            console.log("デフォルトモデルを正常に読み込みました");
          } else {
            throw new Error(
              result.error || "デフォルトモデルの読み込みに失敗しました"
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "デフォルトモデルの読み込みエラー";
          set({ error: errorMessage });
          console.error("デフォルトモデル読み込みエラー:", errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },

      initializeDefaultModel: async () => {
        const state = get();

        // デフォルトモデルが既に存在するかチェック
        const existingDefaultModel = state.availableModels.find(
          (model) => model.isDefault
        );

        if (existingDefaultModel) {
          // 既存のデフォルトモデルを現在のモデルとして設定
          if (!state.currentModel) {
            get().setCurrentModel(existingDefaultModel);
            console.log("既存のデフォルトモデルを設定しました");
          }
          return;
        }

        // 現在のモデルが存在せず、デフォルトモデルも存在しない場合のみ読み込み
        if (!state.currentModel) {
          console.log("デフォルトモデルを初期化します");
          await get().loadDefaultModel();
        }
      },

      // アニメーション制御
      playAnimation: (animationName) =>
        set((state) => ({
          animationState: {
            ...state.animationState,
            isPlaying: true,
            currentAnimation:
              animationName || state.animationState.currentAnimation,
          },
        })),

      pauseAnimation: () =>
        set((state) => ({
          animationState: {
            ...state.animationState,
            isPlaying: false,
          },
        })),

      stopAnimation: () =>
        set((state) => ({
          animationState: {
            ...state.animationState,
            isPlaying: false,
            currentAnimation: undefined,
          },
        })),

      setAnimationSpeed: (speed) =>
        set((state) => ({
          animationState: {
            ...state.animationState,
            speed: Math.max(0.1, Math.min(3, speed)), // 0.1-3.0の範囲に制限
          },
        })),

      toggleAnimationLoop: () =>
        set((state) => ({
          animationState: {
            ...state.animationState,
            loop: !state.animationState.loop,
          },
        })),
    }),
    {
      name: "echoes-model-store",
      // 永続化から除外するフィールド
      partialize: (state) => ({
        availableModels: state.availableModels.map((model) => ({
          ...model,
          // ファイルオブジェクトは永続化しない
          file: undefined,
          // Three.jsオブジェクトも永続化しない
          vrm: undefined,
          scene: undefined,
        })),
        // currentModelのIDのみ保存
        currentModelId: state.currentModel?.id,
        sceneConfig: state.sceneConfig,
        cameraConfig: state.cameraConfig,
        animationState: {
          ...state.animationState,
          isPlaying: false, // 再起動時は停止状態
        },
      }),
      // 復元時の処理
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 復元時は読み込み状態をリセット
          state.isLoading = false;
          state.error = undefined;

          // アニメーション状態をリセット
          state.animationState.isPlaying = false;
          state.animationState.currentAnimation = undefined;

          // Date型の復元処理
          state.availableModels = state.availableModels.map((model) => ({
            ...model,
            createdAt:
              typeof model.createdAt === "string"
                ? new Date(model.createdAt)
                : model.createdAt,
            lastUsed:
              model.lastUsed && typeof model.lastUsed === "string"
                ? new Date(model.lastUsed)
                : model.lastUsed,
          }));

          // currentModelの復元処理を改善
          const storedState = state as ModelDisplayState & { currentModelId?: string };
          if (storedState.currentModelId) {
            // 保存されたcurrentModelIdから復元
            const restoredModel = state.availableModels.find(
              (model) => model.id === storedState.currentModelId
            );
            if (restoredModel) {
              state.currentModel = restoredModel;
              console.log("復元時にモデルを復元しました:", restoredModel.name);
            } else {
              // 該当するモデルが見つからない場合はデフォルトモデルを設定
              const defaultModel = state.availableModels.find((model) => model.isDefault);
              if (defaultModel) {
                state.currentModel = defaultModel;
                console.log("復元時にデフォルトモデルを設定しました:", defaultModel.name);
              }
            }
          } else if (!state.currentModel) {
            // currentModelIdが保存されていない場合はデフォルトモデルを設定
            const defaultModel = state.availableModels.find((model) => model.isDefault);
            if (defaultModel) {
              state.currentModel = defaultModel;
              console.log("復元時にデフォルトモデルを設定しました:", defaultModel.name);
            }
          }

        }
      },
    }
  )
);
