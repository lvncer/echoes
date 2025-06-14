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
        set((state) => ({
          availableModels: [...state.availableModels, model],
        })),

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
          console.log("デフォルトモデルの読み込みを開始します");
          set({ isLoading: true, error: undefined });

          // デフォルトモデルのパス
          const defaultModelPath = "/models/test/AliciaSolid.vrm";
          console.log("デフォルトモデルパス:", defaultModelPath);

          // ファイルをfetchで取得
          const response = await fetch(defaultModelPath);
          if (!response.ok) {
            throw new Error(
              `デフォルトモデルの読み込みに失敗しました: ${response.status}`
            );
          }

          console.log("デフォルトモデルファイルの取得に成功");

          // Blobからファイルオブジェクトを作成
          const blob = await response.blob();
          const file = new File([blob], "AliciaSolid.vrm", {
            type: "application/octet-stream",
          });

          console.log(
            "ファイルオブジェクト作成完了:",
            file.name,
            file.size,
            "bytes"
          );

          // モデルを読み込み
          const result = await loadModel(file);

          if (result.success && result.model) {
            // デフォルトモデルとしてマーク
            const defaultModel = {
              ...result.model,
              name: "ニコニ立体ちゃん（デフォルト）",
              isDefault: true,
            };

            // ストアに追加
            get().addModel(defaultModel);
            get().setCurrentModel(defaultModel);

            console.log("デフォルトモデルを読み込みました:", defaultModel.name);
            console.log("モデル形式:", defaultModel.format);
            console.log(
              "VRMオブジェクト:",
              defaultModel.format === "vrm" ? "存在" : "なし"
            );
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
          console.error(
            "デフォルトモデルの読み込みに失敗しました:",
            errorMessage,
            error
          );
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      initializeDefaultModel: async () => {
        const state = get();

        // 現在のモデルが存在しない場合のみデフォルトモデルを読み込み
        if (!state.currentModel) {
          console.log(
            "現在のモデルが存在しないため、デフォルトモデルを読み込みます"
          );
          await get().loadDefaultModel();
        } else {
          console.log("現在のモデルが存在します:", state.currentModel.name);
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
          state.currentModel = undefined;

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

          console.log(
            "ストア復元完了 - 利用可能なモデル数:",
            state.availableModels.length
          );
        }
      },
    }
  )
);
