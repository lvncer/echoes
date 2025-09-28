"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, X } from "lucide-react";

interface MessageTemplate {
  id: string;
  title: string;
  message: string;
  category: string;
}

interface MessageTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (message: string) => void;
}

// メッセージテンプレートデータ
const messageTemplates: MessageTemplate[] = [
  {
    id: "greeting-1",
    title: "朝の挨拶",
    message: "おはようございます！今日はどんな1日になりそうですか？",
    category: "挨拶",
  },
  {
    id: "greeting-2",
    title: "夜の挨拶",
    message: "お疲れ様でした！今日はどんな1日でしたか？",
    category: "挨拶",
  },
  {
    id: "chat-1",
    title: "趣味について",
    message: "最近はまっている趣味や興味のあることはありますか？",
    category: "雑談",
  },
  {
    id: "chat-2",
    title: "今日の気分",
    message: "今日の気分はいかがですか？何か特別なことはありましたか？",
    category: "雑談",
  },
  {
    id: "help-1",
    title: "悩み相談",
    message: "何か悩んでいることがあれば、お聞かせください。一緒に考えましょう。",
    category: "サポート",
  },
  {
    id: "help-2",
    title: "アドバイス",
    message: "何かアドバイスが欲しいことはありますか？お手伝いします。",
    category: "サポート",
  },
  {
    id: "creative-1",
    title: "創作活動",
    message: "何か創作活動をしていますか？アイデアを一緒に考えましょう！",
    category: "創作",
  },
  {
    id: "creative-2",
    title: "学習",
    message: "新しく学んでいることはありますか？興味のある分野を教えてください。",
    category: "創作",
  },
];

export function MessageTemplatePanel({
  isOpen,
  onClose,
  onTemplateSelect,
}: MessageTemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // カテゴリーの一覧を取得
  const categories = ["all", ...Array.from(new Set(messageTemplates.map((t) => t.category)))];

  // フィルタリングされたテンプレート
  const filteredTemplates =
    selectedCategory === "all"
      ? messageTemplates
      : messageTemplates.filter((t) => t.category === selectedCategory);

  const handleTemplateClick = (template: MessageTemplate) => {
    onTemplateSelect(template.message);
    onClose();
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* パネル */}
      <div
        className={`
        fixed top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl
        border-l border-gray-700/50 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">メッセージテンプレート</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* カテゴリーフィルター */}
        <div className="p-6 border-b border-gray-700/30 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`text-xs cursor-pointer ${
                  selectedCategory === category
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                {category === "all" ? "すべて" : category}
              </Button>
            ))}
          </div>
        </div>

        {/* テンプレート一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-4 bg-gray-800/50 border-gray-400/50 hover:bg-gray-700/50
                       cursor-pointer transition-colors duration-200 group"
              onClick={() => handleTemplateClick(template)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                    {template.title}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-gray-700/70 text-gray-300 rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{template.message}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-700/30 flex-shrink-0">
          <div className="text-xs text-gray-400 text-center">
            💡 テンプレートをクリックして音声チャットを開始
          </div>
        </div>
      </div>
    </>
  );
}
