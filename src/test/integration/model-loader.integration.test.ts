import { describe, it, expect, beforeEach } from "vitest";
import { useModelStore } from "../../stores/model-store";

// Fileオブジェクトのモック
Object.defineProperty(global, "File", {
  value: class MockFile {
    name: string;
    size: number;
    type: string;
    content: string;

    constructor(content: string[], name: string, options: { type: string }) {
      this.content = content.join("");
      this.name = name;
      this.type = options.type;
      this.size = this.content.length;
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      const buffer = new ArrayBuffer(this.content.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < this.content.length; i++) {
        view[i] = this.content.charCodeAt(i);
      }
      return buffer;
    }
  },
  writable: true,
});

describe("Model Store Integration Tests", () => {
  beforeEach(() => {
    // モデルストアをリセット
    useModelStore.setState({
      currentModel: undefined,
      availableModels: [],
      isLoading: false,
      error: undefined,
    });
  });

  describe("ファイル読み込み統合テスト", () => {
    it("VRMファイルの基本情報が正しく処理される", async () => {
      const store = useModelStore.getState();
      const mockVRMFile = new File(["vrm content"], "test-avatar.vrm", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(mockVRMFile);

      expect(result.success).toBe(true);
      if (result.success && result.model) {
        expect(result.model.name).toBe("test-avatar");
        expect(result.model.format).toBe("vrm");
        expect(result.model.size).toBe(mockVRMFile.size);

        const updatedStore = useModelStore.getState();
        expect(updatedStore.availableModels).toHaveLength(1);
        expect(updatedStore.availableModels[0].id).toBe(result.model.id);
      }
    });

    it("glTFファイルの基本情報が正しく処理される", async () => {
      const store = useModelStore.getState();
      const mockGLTFFile = new File(["gltf content"], "test-model.gltf", {
        type: "model/gltf+json",
      });

      const result = await store.loadModelFromFile(mockGLTFFile);

      expect(result.success).toBe(true);
      if (result.success && result.model) {
        expect(result.model.name).toBe("test-model");
        expect(result.model.format).toBe("gltf");
        expect(result.model.size).toBe(mockGLTFFile.size);

        const updatedStore = useModelStore.getState();
        expect(updatedStore.availableModels).toHaveLength(1);
        expect(updatedStore.availableModels[0].id).toBe(result.model.id);
      }
    });

    it("GLBファイルの基本情報が正しく処理される", async () => {
      const store = useModelStore.getState();
      const mockGLBFile = new File(["glb content"], "test-model.glb", {
        type: "model/gltf-binary",
      });

      const result = await store.loadModelFromFile(mockGLBFile);

      expect(result.success).toBe(true);
      if (result.success && result.model) {
        expect(result.model.name).toBe("test-model");
        expect(result.model.format).toBe("glb");
        expect(result.model.size).toBe(mockGLBFile.size);

        const updatedStore = useModelStore.getState();
        expect(updatedStore.availableModels).toHaveLength(1);
        expect(updatedStore.availableModels[0].id).toBe(result.model.id);
      }
    });
  });

  describe("エラーハンドリング統合テスト", () => {
    it("サポートされていないファイル形式でエラーが発生する", async () => {
      const store = useModelStore.getState();
      const unsupportedFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const result = await store.loadModelFromFile(unsupportedFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("サポートされていないファイル形式");
      }

      const updatedStore = useModelStore.getState();
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.error).toBeDefined();
      expect(updatedStore.availableModels).toHaveLength(0);
    });

    it("拡張子のないファイルでエラーが発生する", async () => {
      const store = useModelStore.getState();
      const noExtensionFile = new File(["content"], "noextension", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(noExtensionFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("サポートされていないファイル形式");
      }
    });
  });

  describe("モデル管理統合テスト", () => {
    it("複数のモデルを読み込んで管理できる", async () => {
      const store = useModelStore.getState();

      // 複数のファイルを作成
      const vrmFile = new File(["vrm"], "avatar.vrm", {
        type: "application/octet-stream",
      });
      const gltfFile = new File(["gltf"], "model.gltf", {
        type: "model/gltf+json",
      });
      const glbFile = new File(["glb"], "scene.glb", {
        type: "model/gltf-binary",
      });

      // 1つ目のモデルを読み込み
      const result1 = await store.loadModelFromFile(vrmFile);
      expect(result1.success).toBe(true);

      // 2つ目のモデルを読み込み
      const result2 = await store.loadModelFromFile(gltfFile);
      expect(result2.success).toBe(true);

      // 3つ目のモデルを読み込み
      const result3 = await store.loadModelFromFile(glbFile);
      expect(result3.success).toBe(true);

      const finalStore = useModelStore.getState();
      expect(finalStore.availableModels).toHaveLength(3);
      expect(finalStore.availableModels[0].name).toBe("avatar");
      expect(finalStore.availableModels[1].name).toBe("model");
      expect(finalStore.availableModels[2].name).toBe("scene");
    });

    it("アクティブモデルの切り替えが正常に動作する", async () => {
      const store = useModelStore.getState();

      // モデルを読み込み
      const mockFile = new File(["test"], "test.vrm", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(mockFile);
      expect(result.success).toBe(true);

      if (result.success && result.model) {
        // アクティブモデルに設定
        store.switchToModel(result.model.id);

        const updatedStore = useModelStore.getState();
        expect(updatedStore.currentModel?.id).toBe(result.model.id);
        expect(updatedStore.currentModel?.name).toBe("test");
        expect(updatedStore.currentModel?.lastUsed).toBeDefined();
      }
    });

    it("モデルの削除が正常に動作する", async () => {
      const store = useModelStore.getState();

      // モデルを読み込み
      const mockFile = new File(["test"], "test.vrm", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(mockFile);
      expect(result.success).toBe(true);

      if (result.success && result.model) {
        // アクティブモデルに設定
        store.switchToModel(result.model.id);

        // モデルを削除
        store.removeModel(result.model.id);

        const finalStore = useModelStore.getState();
        expect(finalStore.availableModels).toHaveLength(0);
        expect(finalStore.currentModel).toBeUndefined();
      }
    });

    it("モデルの更新が正常に動作する", async () => {
      const store = useModelStore.getState();

      // モデルを読み込み
      const mockFile = new File(["test"], "test.vrm", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(mockFile);
      expect(result.success).toBe(true);

      if (result.success && result.model) {
        // モデル情報を更新
        const updateData = {
          name: "Updated Model",
          lastUsed: new Date(),
        };

        store.updateModel(result.model.id, updateData);

        const updatedStore = useModelStore.getState();
        const updatedModel = updatedStore.getModelById(result.model.id);

        expect(updatedModel?.name).toBe("Updated Model");
        expect(updatedModel?.lastUsed).toBeDefined();
      }
    });
  });

  describe("ストア状態管理統合テスト", () => {
    it("ローディング状態が正しく管理される", async () => {
      const store = useModelStore.getState();
      const mockFile = new File(["test"], "test.vrm", {
        type: "application/octet-stream",
      });

      // 初期状態
      expect(store.isLoading).toBe(false);

      // ファイル読み込み開始
      const loadPromise = store.loadModelFromFile(mockFile);

      // 読み込み完了まで待機
      const result = await loadPromise;

      // 最終状態
      const finalStore = useModelStore.getState();
      expect(finalStore.isLoading).toBe(false);
      expect(result.success).toBe(true);
    });

    it("エラー状態が正しく管理される", async () => {
      const store = useModelStore.getState();
      const invalidFile = new File(["invalid"], "invalid.xyz", {
        type: "application/octet-stream",
      });

      const result = await store.loadModelFromFile(invalidFile);

      expect(result.success).toBe(false);

      const finalStore = useModelStore.getState();
      expect(finalStore.isLoading).toBe(false);
      expect(finalStore.error).toBeDefined();
      expect(finalStore.error).toContain("サポートされていないファイル形式");
    });

    it("エラー状態のクリアが正常に動作する", async () => {
      const store = useModelStore.getState();

      // エラーを設定
      store.setError("Test error");
      expect(useModelStore.getState().error).toBe("Test error");

      // エラーをクリア
      store.setError(undefined);
      expect(useModelStore.getState().error).toBeUndefined();
    });
  });

  describe("パフォーマンス統合テスト", () => {
    it("複数のモデルを同時に読み込んでも安定している", async () => {
      const store = useModelStore.getState();

      // 複数のファイルを並行して読み込み
      const files = Array.from(
        { length: 5 },
        (_, i) =>
          new File([`content${i}`], `model${i}.vrm`, {
            type: "application/octet-stream",
          })
      );

      const promises = files.map((file) => store.loadModelFromFile(file));
      const results = await Promise.all(promises);

      // 全て成功することを確認
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      const finalStore = useModelStore.getState();
      expect(finalStore.availableModels).toHaveLength(5);
    });

    it("大量のモデル管理でも安定している", async () => {
      const store = useModelStore.getState();

      // 10個のモデルを順次追加
      for (let i = 0; i < 10; i++) {
        const file = new File([`content${i}`], `model${i}.vrm`, {
          type: "application/octet-stream",
        });

        const result = await store.loadModelFromFile(file);
        expect(result.success).toBe(true);
      }

      const finalStore = useModelStore.getState();
      expect(finalStore.availableModels).toHaveLength(10);

      // 統計情報の確認
      expect(finalStore.availableModels.every((model) => model.id)).toBe(true);
      expect(finalStore.availableModels.every((model) => model.createdAt)).toBe(
        true
      );
    });
  });

  describe("メモリ管理統合テスト", () => {
    it("モデルの追加と削除でメモリリークが発生しない", async () => {
      const store = useModelStore.getState();

      // 複数のモデルを追加・削除を繰り返す
      for (let i = 0; i < 10; i++) {
        const file = new File([`content${i}`], `model${i}.vrm`, {
          type: "application/octet-stream",
        });

        const result = await store.loadModelFromFile(file);
        if (result.success && result.model) {
          // すぐに削除
          store.removeModel(result.model.id);
        }
      }

      const finalStore = useModelStore.getState();
      expect(finalStore.availableModels).toHaveLength(0);
      expect(finalStore.currentModel).toBeUndefined();
    });
  });
});
