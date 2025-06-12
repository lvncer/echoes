"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Model3DViewer } from "@/components/3d/model-3d-viewer";
import { BlendShapePanel } from "@/components/3d/blend-shape-panel";
import { LipSyncPanel } from "@/components/3d/lipsync-panel";
import { AdvancedLipSyncPanel } from "@/components/3d/advanced-lipsync-panel";
import { IntegratedLipSyncPanel } from "@/components/3d/integrated-lipsync-panel";
import { SimpleDebugPanel } from "@/components/3d/simple-debug-panel";
import { AnimationControlPanel } from "@/components/3d/animation-control-panel";
import Chat from "../components/chat";
import { AudioChatControls } from "@/components/AudioChatControls";
import { Box, MessageCircle, Settings, Mic, Download } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useModelStore } from "@/stores/model-store";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");
  const [isHydrated, setIsHydrated] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);

  // モデルストアからデフォルトモデル初期化関数を取得
  const { initializeDefaultModel, loadDefaultModel, isLoading, currentModel } =
    useModelStore();

  // 音声チャット履歴のスクロール制御
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollPositionRef = useRef<number>(0);

  // ハイドレーション完了を検知
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // アプリケーション起動時にデフォルトモデルを初期化
  useEffect(() => {
    // 少し遅延させてストアの復元を待つ
    const timer = setTimeout(() => {
      console.log("デフォルトモデル初期化を実行");
      initializeDefaultModel();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeDefaultModel]);

  // デバッグ用：現在のモデル状態をログ出力
  useEffect(() => {
    console.log("現在のモデル状態:", currentModel ? currentModel.name : "なし");
  }, [currentModel]);

  // メッセージ追加時のスクロール制御
  useEffect(() => {
    if (chatMessages.length > 0 && chatHistoryRef.current) {
      const container = chatHistoryRef.current;

      if (shouldAutoScroll) {
        // 最下部にスクロール（スムーズに）
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
      } else {
        // ユーザーが手動スクロールしている場合は位置を保持
        setTimeout(() => {
          container.scrollTop = scrollPositionRef.current;
        }, 0);
      }
    }
  }, [chatMessages, shouldAutoScroll]);

  // ユーザーが手動でスクロールした場合の検知
  const handleScroll = useCallback(() => {
    if (!chatHistoryRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20pxの余裕

    // スクロール位置を保存
    scrollPositionRef.current = scrollTop;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // メッセージ追加前のスクロール位置を保存
  const preserveScrollPosition = useCallback(() => {
    if (chatHistoryRef.current && !shouldAutoScroll) {
      scrollPositionRef.current = chatHistoryRef.current.scrollTop;
    }
  }, [shouldAutoScroll]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Echoes</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              v1.0.0
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            3D モデルと AI によるリアルタイム音声会話アプリケーション
          </p>
        </header>

        {/* メインコンテンツ */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* 左側: リップシンク制御パネル */}
          <div className="w-80 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                リップシンク制御
              </h2>
              <div className="space-y-4">
                <LipSyncPanel />
                <AdvancedLipSyncPanel />
                <IntegratedLipSyncPanel />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ブレンドシェイプ制御
              </h2>
              <BlendShapePanel />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                アニメーション制御
              </h2>
              <AnimationControlPanel />
            </div>
          </div>

          {/* 中央: 3Dビューアー */}
          <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <ErrorBoundary>
              <Model3DViewer />
            </ErrorBoundary>
          </div>

          {/* 右側: チャット・設定 */}
          <div className="w-80 flex-shrink-0 relative">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  チャット
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  音声
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  設定
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 mt-4">
                <div className="h-full">
                  <ErrorBoundary>
                    <Chat />
                  </ErrorBoundary>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="flex-1 mt-4">
                <div className="h-full space-y-4">
                  <ErrorBoundary>
                    <AudioChatControls
                      onTranscriptReceived={(transcript, isFinal) => {
                        if (isFinal) {
                          // メッセージ追加前にスクロール位置を保存
                          preserveScrollPosition();
                          setChatMessages((prev) => [
                            ...prev,
                            {
                              role: "user",
                              content: transcript,
                              timestamp: new Date(),
                            },
                          ]);
                        }
                      }}
                      onAIResponseReceived={(response) => {
                        // メッセージ追加前にスクロール位置を保存
                        preserveScrollPosition();
                        setChatMessages((prev) => [
                          ...prev,
                          {
                            role: "assistant",
                            content: response,
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                    />
                  </ErrorBoundary>

                  {/* 音声チャット履歴 */}
                  <div
                    className="bg-white rounded-lg shadow-lg p-4 flex-1 overflow-y-auto"
                    ref={chatHistoryRef}
                    onScroll={handleScroll}
                    style={{
                      scrollBehavior: "smooth",
                      scrollPaddingTop: "1rem",
                      scrollPaddingBottom: "1rem",
                    }}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      音声チャット履歴
                    </h3>
                    <div className="space-y-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          音声チャットを開始すると、会話履歴がここに表示されます。
                        </p>
                      ) : (
                        chatMessages.map((message, index) => (
                          <div
                            key={`${
                              message.role
                            }-${index}-${message.timestamp.getTime()}`}
                            className={`p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-blue-50 border-l-4 border-blue-400"
                                : "bg-green-50 border-l-4 border-green-400"
                            }`}
                            tabIndex={-1}
                            style={{ outline: "none" }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">
                                {message.role === "user" ? "あなた" : "AI"}
                              </span>
                              {/* 時刻表示 - ハイドレーション後にのみ表示 */}
                              {isHydrated && (
                                <span className="text-xs text-gray-500">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {message.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 mt-4">
                <div className="bg-white rounded-lg shadow-lg p-4 h-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    設定
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        3D表示設定
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>グリッド表示</span>
                          <span className="text-green-600">ON</span>
                        </div>
                        <div className="flex justify-between">
                          <span>影の表示</span>
                          <span className="text-green-600">ON</span>
                        </div>
                        <div className="flex justify-between">
                          <span>統計情報</span>
                          <span className="text-gray-400">開発モードのみ</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        カメラ操作
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>回転</span>
                          <span className="text-green-600">有効</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ズーム</span>
                          <span className="text-green-600">有効</span>
                        </div>
                        <div className="flex justify-between">
                          <span>パン</span>
                          <span className="text-green-600">有効</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        デフォルトモデル
                      </h4>
                      <div className="space-y-2">
                        <Button
                          onClick={loadDefaultModel}
                          disabled={isLoading}
                          className="w-full flex items-center gap-2"
                          variant="outline"
                        >
                          <Download className="w-4 h-4" />
                          {isLoading
                            ? "読み込み中..."
                            : "ニコニ立体ちゃんを読み込み"}
                        </Button>
                        <p className="text-xs text-gray-500">
                          テスト用のVRMモデルを読み込みます
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        3Dモデルは中央のビューアーエリアにドラッグ&ドロップできます。
                        VRM、glTF、GLB形式に対応しています。
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* デバッグパネル */}
            <div className="absolute bottom-4 right-4 z-10">
              <SimpleDebugPanel />
            </div>
          </div>
        </div>

        {/* フッター */}
        <footer className="mt-4 text-center text-sm text-gray-500">
          <p>Echoes - AI Avatar Chat Application</p>
        </footer>
      </div>
    </main>
  );
}
