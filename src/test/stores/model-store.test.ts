import { describe, it, expect, beforeEach } from "vitest";
import { useModelStore } from "../../stores/model-store";
import type { Model3D } from "../../lib/types/3d";

// Zustandストアのテスト用ヘルパー
const createMockModel = (id: string, name: string): Model3D => ({
  id,
  name,
  format: "vrm",
  url: `blob:${id}`,
  size: 1024,
  createdAt: new Date(),
});

describe("ModelStore", () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useModelStore.setState({
      currentModel: undefined,
      availableModels: [],
      isLoading: false,
      error: undefined,
    });
  });

  describe("モデル管理", () => {
    it("モデルを追加できる", () => {
      const mockModel = createMockModel("test-1", "Test Model");

      useModelStore.getState().addModel(mockModel);

      const state = useModelStore.getState();
      expect(state.availableModels).toHaveLength(1);
      expect(state.availableModels[0]).toEqual(mockModel);
    });

    it("複数のモデルを追加できる", () => {
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      useModelStore.getState().addModel(model1);
      useModelStore.getState().addModel(model2);

      const state = useModelStore.getState();
      expect(state.availableModels).toHaveLength(2);
      expect(state.availableModels).toContain(model1);
      expect(state.availableModels).toContain(model2);
    });

    it("モデルを削除できる", () => {
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      const store = useModelStore.getState();
      store.addModel(model1);
      store.addModel(model2);
      store.removeModel("test-1");

      const state = useModelStore.getState();
      expect(state.availableModels).toHaveLength(1);
      expect(state.availableModels[0]).toEqual(model2);
    });

    it("存在しないモデルの削除は無視される", () => {
      const model1 = createMockModel("test-1", "Model 1");

      const store = useModelStore.getState();
      store.addModel(model1);
      store.removeModel("non-existent");

      const state = useModelStore.getState();
      expect(state.availableModels).toHaveLength(1);
      expect(state.availableModels[0]).toEqual(model1);
    });

    it("全モデルをクリアできる", () => {
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      const store = useModelStore.getState();
      store.addModel(model1);
      store.addModel(model2);

      // 全モデルを削除
      const currentState = useModelStore.getState();
      currentState.availableModels.forEach((model) =>
        store.removeModel(model.id)
      );

      const finalState = useModelStore.getState();
      expect(finalState.availableModels).toHaveLength(0);
    });
  });

  describe("アクティブモデル管理", () => {
    it("アクティブモデルを設定できる", () => {
      const mockModel = createMockModel("test-1", "Test Model");

      const store = useModelStore.getState();
      store.addModel(mockModel);
      store.setCurrentModel(mockModel);

      const state = useModelStore.getState();
      expect(state.currentModel?.id).toBe("test-1");
    });

    it("存在しないモデルをアクティブに設定しようとすると無視される", () => {
      const mockModel = createMockModel("test-1", "Test Model");

      const store = useModelStore.getState();
      store.addModel(mockModel);
      // switchToModelは存在チェックを行う
      store.switchToModel("non-existent");

      const state = useModelStore.getState();
      expect(state.currentModel).toBeUndefined();
    });

    it("アクティブモデルを取得できる", () => {
      const mockModel = createMockModel("test-1", "Test Model");

      const store = useModelStore.getState();
      store.addModel(mockModel);
      store.setCurrentModel(mockModel);

      const state = useModelStore.getState();
      expect(state.currentModel).toEqual(mockModel);
    });

    it("アクティブモデルが設定されていない場合はundefinedを返す", () => {
      const state = useModelStore.getState();
      expect(state.currentModel).toBeUndefined();
    });
  });

  describe("ローディング状態管理", () => {
    it("ローディング状態を設定できる", () => {
      const initialState = useModelStore.getState();
      expect(initialState.isLoading).toBe(false);

      useModelStore.getState().setLoading(true);
      const loadingState = useModelStore.getState();
      expect(loadingState.isLoading).toBe(true);

      useModelStore.getState().setLoading(false);
      const finalState = useModelStore.getState();
      expect(finalState.isLoading).toBe(false);
    });
  });

  describe("エラー状態管理", () => {
    it("エラー状態を設定できる", () => {
      const initialState = useModelStore.getState();
      expect(initialState.error).toBeUndefined();

      const errorMessage = "Test error";
      useModelStore.getState().setError(errorMessage);
      const errorState = useModelStore.getState();
      expect(errorState.error).toBe(errorMessage);

      useModelStore.getState().setError(undefined);
      const finalState = useModelStore.getState();
      expect(finalState.error).toBeUndefined();
    });
  });

  describe("統計情報", () => {
    it("モデル数を正しく返す", () => {
      const initialState = useModelStore.getState();
      expect(initialState.availableModels.length).toBe(0);

      useModelStore.getState().addModel(createMockModel("test-1", "Model 1"));
      const state1 = useModelStore.getState();
      expect(state1.availableModels.length).toBe(1);

      useModelStore.getState().addModel(createMockModel("test-2", "Model 2"));
      const state2 = useModelStore.getState();
      expect(state2.availableModels.length).toBe(2);

      useModelStore.getState().removeModel("test-1");
      const finalState = useModelStore.getState();
      expect(finalState.availableModels.length).toBe(1);
    });

    it("総サイズを正しく計算する", () => {
      const model1 = { ...createMockModel("test-1", "Model 1"), size: 1000 };
      const model2 = { ...createMockModel("test-2", "Model 2"), size: 2000 };

      const store = useModelStore.getState();
      store.addModel(model1);
      store.addModel(model2);

      const state = useModelStore.getState();
      const totalSize = state.availableModels.reduce(
        (sum, model) => sum + model.size,
        0
      );
      expect(totalSize).toBe(3000);
    });
  });

  describe("永続化", () => {
    it("ストアの状態が正しく管理される", () => {
      const mockModel = createMockModel("test-1", "Test Model");

      // ストアの状態変更をテスト
      const store = useModelStore.getState();
      store.addModel(mockModel);
      store.setCurrentModel(mockModel);

      const finalState = useModelStore.getState();

      // 状態が正しく保存されていることを確認
      expect(finalState.availableModels).toHaveLength(1);
      expect(finalState.currentModel).toEqual(mockModel);
      expect(finalState.availableModels[0]).toEqual(mockModel);
    });
  });
});
