import { VRM, VRMLoaderPlugin } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Group, LoadingManager } from "three";
import {
  Model3D,
  VRMModelInfo,
  GLTFModelInfo,
  ModelLoadResult,
  LoadOptions,
} from "@/lib/types/3d";

// ローディングマネージャー
const loadingManager = new LoadingManager();

// GLTFローダーの初期化
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.register((parser) => new VRMLoaderPlugin(parser));

/**
 * VRMモデルを読み込む
 */
export async function loadVRMModel(
  file: File,
  options: LoadOptions = {}
): Promise<ModelLoadResult> {
  try {
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();

    // GLTFとしてロード（VRMはglTFベース）
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.parse(
        arrayBuffer,
        "",
        (gltf) => resolve(gltf),
        (error) => reject(error)
      );
    });

    // VRMデータを取得
    const vrm: VRM = gltf.userData.vrm;

    if (!vrm) {
      throw new Error(
        "VRMデータが見つかりません。有効なVRMファイルを選択してください。"
      );
    }

    // スケール・位置・回転の適用
    if (options.scale) {
      vrm.scene.scale.setScalar(options.scale);
    }
    if (options.position) {
      vrm.scene.position.set(...options.position);
    }
    if (options.rotation) {
      vrm.scene.rotation.set(...options.rotation);
    }

    // VRMモデル情報を作成
    const modelInfo: VRMModelInfo = {
      id: `vrm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      format: "vrm",
      size: file.size,
      file,
      createdAt: new Date(),
      vrm,
      meta: {
        title: vrm.meta?.title,
        author: vrm.meta?.author,
        version: vrm.meta?.version,
        description: vrm.meta?.description,
        licenseUrl: vrm.meta?.licenseUrl,
        contactInformation: vrm.meta?.contactInformation,
      },
    };

    return { success: true, model: modelInfo };
  } catch (error) {
    console.error("VRM読み込みエラー:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "VRMファイルの読み込みに失敗しました";
    return { success: false, error: errorMessage };
  }
}

/**
 * glTF/GLBモデルを読み込む
 */
export async function loadGLTFModel(
  file: File,
  options: LoadOptions = {}
): Promise<ModelLoadResult> {
  try {
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();

    // GLTFとしてロード
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.parse(
        arrayBuffer,
        "",
        (gltf) => resolve(gltf),
        (error) => reject(error)
      );
    });

    const scene: Group = gltf.scene;

    if (!scene) {
      throw new Error(
        "3Dシーンが見つかりません。有効なglTF/GLBファイルを選択してください。"
      );
    }

    // スケール・位置・回転の適用
    if (options.scale) {
      scene.scale.setScalar(options.scale);
    }
    if (options.position) {
      scene.position.set(...options.position);
    }
    if (options.rotation) {
      scene.rotation.set(...options.rotation);
    }

    // アニメーションの処理
    const animations = gltf.animations || [];
    const animationNames = animations.map(
      (anim: any) => anim.name || "Unnamed"
    );

    // ファイル拡張子を判定
    const extension = file.name.split(".").pop()?.toLowerCase() as
      | "gltf"
      | "glb";

    // glTFモデル情報を作成
    const modelInfo: GLTFModelInfo = {
      id: `gltf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      format: extension,
      size: file.size,
      file,
      createdAt: new Date(),
      scene,
    };

    return { success: true, model: modelInfo };
  } catch (error) {
    console.error("glTF読み込みエラー:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "glTF/GLBファイルの読み込みに失敗しました";
    return { success: false, error: errorMessage };
  }
}

/**
 * ファイル形式に応じて適切なローダーを選択
 */
export async function loadModel(
  file: File,
  options: LoadOptions = {}
): Promise<ModelLoadResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "vrm":
      return loadVRMModel(file, options);
    case "gltf":
    case "glb":
      return loadGLTFModel(file, options);
    default:
      return {
        success: false,
        error: `サポートされていないファイル形式: ${extension}。VRM、glTF、GLBファイルを選択してください。`,
      };
  }
}

/**
 * モデルのサムネイルを生成（将来実装）
 */
export async function generateModelThumbnail(
  model: Model3D
): Promise<string | undefined> {
  // TODO: Three.jsでレンダリングしてサムネイル画像を生成
  return undefined;
}

/**
 * モデルの基本情報を取得
 */
export function getModelInfo(model: Model3D): {
  vertices: number;
  faces: number;
  materials: number;
  textures: number;
} {
  let vertices = 0;
  let faces = 0;
  let materials = 0;
  let textures = 0;

  try {
    const scene =
      model.format === "vrm"
        ? (model as VRMModelInfo).vrm?.scene
        : (model as GLTFModelInfo).scene;

    if (scene) {
      scene.traverse((child) => {
        if (child.type === "Mesh") {
          const mesh = child as any;
          if (mesh.geometry) {
            const geometry = mesh.geometry;
            vertices += geometry.attributes.position?.count || 0;
            faces += geometry.index ? geometry.index.count / 3 : vertices / 3;
          }
          if (mesh.material) {
            materials++;
            if (mesh.material.map) textures++;
          }
        }
      });
    }
  } catch (error) {
    console.warn("モデル情報の取得に失敗:", error);
  }

  return { vertices, faces, materials, textures };
}

/**
 * ローディング進捗の監視
 */
export function setupLoadingProgress(
  onProgress?: (progress: number) => void,
  onComplete?: () => void
) {
  loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    onProgress?.(progress);
  };

  loadingManager.onLoad = () => {
    onComplete?.();
  };

  loadingManager.onError = (url) => {
    console.error("ローディングエラー:", url);
  };
}
