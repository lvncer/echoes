"use client";

import { useCallback, useState } from "react";
import { Upload, Trash2, Info, FileText } from "lucide-react";
import { Model3D, ModelSelectorProps } from "@/lib/types/3d";

/**
 * モデル選択・管理コンポーネント
 */
export function ModelSelector({
  models,
  currentModel,
  onModelSelect,
  onModelUpload,
  onModelDelete,
  isLoading = false,
}: ModelSelectorProps) {
  const [dragOver, setDragOver] = useState(false);

  // ファイルドロップハンドラー
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const modelFile = files.find((file) =>
        ["vrm", "gltf", "glb"].includes(
          file.name.split(".").pop()?.toLowerCase() || ""
        )
      );

      if (modelFile) {
        onModelUpload(modelFile);
      }
    },
    [onModelUpload]
  );

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onModelUpload(file);
      }
      // inputをリセット
      e.target.value = "";
    },
    [onModelUpload]
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        3Dモデル管理
      </h3>

      {/* ファイルアップロード領域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${isLoading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">
          VRM、glTF、GLBファイルをドラッグ&ドロップ
        </p>
        <p className="text-sm text-gray-500 mb-4">または</p>

        <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
          <Upload className="w-4 h-4 mr-2" />
          ファイルを選択
          <input
            type="file"
            accept=".vrm,.gltf,.glb"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />
        </label>

        {isLoading && (
          <div className="mt-4">
            <div className="inline-flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              読み込み中...
            </div>
          </div>
        )}
      </div>

      {/* モデル一覧 */}
      {models.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">読み込み済みモデル</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {models.map((model) => (
              <ModelItem
                key={model.id}
                model={model}
                isSelected={currentModel?.id === model.id}
                onSelect={() => onModelSelect(model)}
                onDelete={() => onModelDelete(model.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 空の状態 */}
      {models.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>まだモデルが読み込まれていません</p>
          <p className="text-sm">上記からファイルをアップロードしてください</p>
        </div>
      )}
    </div>
  );
}

/**
 * 個別モデルアイテム
 */
function ModelItem({
  model,
  isSelected,
  onSelect,
  onDelete,
}: {
  model: Model3D;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={`
              w-2 h-2 rounded-full
              ${model.format === "vrm" ? "bg-green-500" : "bg-blue-500"}
            `}
            />
            <h5 className="font-medium text-gray-800 truncate">{model.name}</h5>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase">
              {model.format}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{(model.size / 1024 / 1024).toFixed(2)} MB</span>
            {model.lastUsed && (
              <span>
                最終使用:
                {model.lastUsed instanceof Date
                  ? model.lastUsed.toLocaleDateString()
                  : new Date(model.lastUsed).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="詳細情報"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      {showInfo && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
          <div className="grid grid-cols-2 gap-2 text-gray-600">
            <div>
              作成日:{" "}
              {model.createdAt instanceof Date
                ? model.createdAt.toLocaleDateString()
                : new Date(model.createdAt).toLocaleDateString()}
            </div>
            <div>ID: {model.id.slice(-8)}</div>

            {model.format === "vrm" && "meta" in model && model.meta && (
              <>
                {model.meta.title && (
                  <div className="col-span-2">タイトル: {model.meta.title}</div>
                )}
                {model.meta.author && (
                  <div className="col-span-2">作者: {model.meta.author}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * モデル読み込み状況表示
 */
export function ModelLoadingStatus({
  isLoading,
  progress,
  error,
}: {
  isLoading: boolean;
  progress?: number;
  error?: string;
}) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="font-medium">読み込みエラー</span>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="font-medium">モデル読み込み中...</span>
        </div>
        {progress !== undefined && (
          <div className="mt-2">
            <div className="bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-blue-700 text-sm mt-1">
              {Math.round(progress * 100)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
