"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Model3DViewer } from "@/components/3d/model-3d-viewer";
import Chat from "../components/chat";
import { Box, MessageCircle, Settings } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        {/* ヘッダー */}
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            Echoes
            <span className="text-lg font-normal text-gray-500">
              - AI Avatar Chat
            </span>
          </h1>
        </header>

        {/* メインコンテンツ */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* 左側: 3Dビューアー */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-lg h-full p-4">
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  3D Avatar
                </h2>
              </div>

              <div className="h-[calc(100%-3rem)]">
                <Model3DViewer
                  className="w-full h-full"
                  onModelLoad={() => {
                    // モデル読み込み完了時の処理
                  }}
                  onError={(error) => {
                    console.error("モデル読み込みエラー:", error);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 右側: チャット・設定 */}
          <div className="w-96 flex-shrink-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  チャット
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
                  <Chat />
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

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        3Dモデルは左側のパネルからアップロードできます。
                        VRM、glTF、GLB形式に対応しています。
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
