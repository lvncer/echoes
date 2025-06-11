import { describe, it, expect, beforeEach, vi } from "vitest";
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
    useModelStore.getState().clearModels();
  });

  describe("モデル管理", () => {
    it("モデルを追加できる", () => {
      const store = useModelStore.getState();
      const mockModel = createMockModel("test-1", "Test Model");

      store.addModel(mockModel);

      expect(store.models).toHaveLength(1);
      expect(store.models[0]).toEqual(mockModel);
    });

    it("複数のモデルを追加できる", () => {
      const store = useModelStore.getState();
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      store.addModel(model1);
      store.addModel(model2);

      expect(store.models).toHaveLength(2);
      expect(store.models).toContain(model1);
      expect(store.models).toContain(model2);
    });

    it("モデルを削除できる", () => {
      const store = useModelStore.getState();
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      store.addModel(model1);
      store.addModel(model2);
      store.removeModel("test-1");

      expect(store.models).toHaveLength(1);
      expect(store.models[0]).toEqual(model2);
    });

    it("存在しないモデルの削除は無視される", () => {
      const store = useModelStore.getState();
      const model1 = createMockModel("test-1", "Model 1");

      store.addModel(model1);
      store.removeModel("non-existent");

      expect(store.models).toHaveLength(1);
      expect(store.models[0]).toEqual(model1);
    });

    it("全モデルをクリアできる", () => {
      const store = useModelStore.getState();
      const model1 = createMockModel("test-1", "Model 1");
      const model2 = createMockModel("test-2", "Model 2");

      store.addModel(model1);
      store.addModel(model2);
      store.clearModels();

      expect(store.models).toHaveLength(0);
    });
  });

  describe("アクティブモデル管理", () => {
    it("アクティブモデルを設定できる", () => {
      const store = useModelStore.getState();
      const mockModel = createMockModel("test-1", "Test Model");

      store.addModel(mockModel);
      store.setActiveModel("test-1");

      expect(store.activeModelId).toBe("test-1");
    });

    it("存在しないモデルをアクティブに設定しようとすると無視される", () => {
      const store = useModelStore.getState();
      const mockModel = createMockModel("test-1", "Test Model");

      store.addModel(mockModel);
      store.setActiveModel("non-existent");

      expect(store.activeModelId).toBeNull();
    });

    it("アクティブモデルを取得できる", () => {
      const store = useModelStore.getState();
      const mockModel = createMockModel("test-1", "Test Model");

      store.addModel(mockModel);
      store.setActiveModel("test-1");

      const activeModel = store.getActiveModel();
      expect(activeModel).toEqual(mockModel);
    });

    it("アクティブモデルが設定されていない場合はnullを返す", () => {
      const store = useModelStore.getState();
      const activeModel = store.getActiveModel();
      expect(activeModel).toBeNull();
    });
  });

  describe("ローディング状態管理", () => {
    it("ローディング状態を設定できる", () => {
      const store = useModelStore.getState();

      expect(store.isLoading).toBe(false);

      store.setLoading(true);
      expect(store.isLoading).toBe(true);

      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });
  });

  describe("エラー状態管理", () => {
    it("エラー状態を設定できる", () => {
      const store = useModelStore.getState();

      expect(store.error).toBeNull();

      const errorMessage = "Test error";
      store.setError(errorMessage);
      expect(store.error).toBe(errorMessage);

      store.setError(null);
      expect(store.error).toBeNull();
    });
  });

  describe("統計情報", () => {
    it("モデル数を正しく返す", () => {
      const store = useModelStore.getState();

      expect(store.getModelCount()).toBe(0);

      store.addModel(createMockModel("test-1", "Model 1"));
      expect(store.getModelCount()).toBe(1);

      store.addModel(createMockModel("test-2", "Model 2"));
      expect(store.getModelCount()).toBe(2);

      store.removeModel("test-1");
      expect(store.getModelCount()).toBe(1);
    });

    it("総サイズを正しく計算する", () => {
      const store = useModelStore.getState();
      const model1 = { ...createMockModel("test-1", "Model 1"), size: 1000 };
      const model2 = { ...createMockModel("test-2", "Model 2"), size: 2000 };

      store.addModel(model1);
      store.addModel(model2);

      expect(store.getTotalSize()).toBe(3000);
    });
  });

  describe("永続化", () => {
    it("ストアの状態を永続化できる", () => {
      const store = useModelStore.getState();
      const mockModel = createMockModel("test-1", "Test Model");

      // localStorageのモック
      const mockSetItem = vi.fn();
      Object.defineProperty(window, "localStorage", {
        value: {
          setItem: mockSetItem,
          getItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      store.addModel(mockModel);
      store.setActiveModel("test-1");

      // 永続化が呼ばれることを確認（Zustandの内部実装に依存）
      expect(mockSetItem).toHaveBeenCalled();
    });
  });
});
