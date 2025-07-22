"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { useAIStore } from "@/lib/stores/ai-store";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
import type { ChatMessage } from "@/lib/types/ai";

interface TextChatInputProps {
  isVoiceChatActive?: boolean;
  voiceChatStatus?: "idle" | "listening" | "processing" | "speaking" | "error";
  className?: string;
}

export function TextChatInput({
  isVoiceChatActive = false,
  voiceChatStatus = "idle",
  className = "",
}: TextChatInputProps) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { sendMessage, messages, isLoading } = useAIStore();

  // ローカルメッセージをAIストアの変更に同期
  useEffect(() => {
    // AIストアから最新のメッセージを取得して、このコンポーネント専用の履歴を更新
    const recentMessages = messages.slice(-10); // 最新10件のみ表示
    setLocalMessages(recentMessages);
  }, [messages]);

  // 自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  // 処理状態の同期
  useEffect(() => {
    setIsProcessing(isLoading);
  }, [isLoading]);

  // 使用可能状態の判定（音声チャットが実際に使用中でない場合は併用可能）
  const canUseTextChat = !isVoiceChatActive || (isVoiceChatActive && voiceChatStatus === "idle");

  // メッセージ送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !canUseTextChat || isProcessing) {
      return;
    }

    const messageText = input.trim();
    setInput("");
    setIsProcessing(true);

    try {
      // AIストアのsendMessageを使用（音声出力付き）
      await sendMessage(messageText, true);
      
      // 少し待ってからAI応答を取得して音声合成
      setTimeout(async () => {
        const latestMessages = useAIStore.getState().messages;
        const latestAIMessage = latestMessages[latestMessages.length - 1];
        
        if (latestAIMessage && latestAIMessage.role === "assistant") {
          // リップシンクサービスを使用してAI応答を音声合成
          await integratedLipSyncService.startAIResponseLipSync(
            latestAIMessage.content
          );
        }
        
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error("テキストチャット送信エラー:", error);
      setIsProcessing(false);
    }
  };

  // 履歴の表示/非表示切り替え
  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <div className={`flex flex-col bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl shadow-2xl ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">テキストチャット</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleHistory}
          className="text-white hover:bg-gray-700/50"
        >
          履歴
        </Button>
      </div>

      {/* メッセージ履歴（展開時のみ表示） */}
      {isHistoryOpen && (
        <div className="max-h-40 overflow-y-auto p-3 border-b border-gray-600/30">
          {localMessages.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-4">
              メッセージ履歴がありません
            </div>
          ) : (
            <div className="space-y-2">
              {localMessages.map((message) => (
                <div
                  key={`${message.id}-${message.timestamp}`}
                  className={`text-xs p-2 rounded-lg max-w-[80%] ${
                    message.role === "user"
                      ? "ml-auto bg-blue-600/80 text-white"
                      : "mr-auto bg-gray-700/80 text-gray-100"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}

      {/* 入力エリア */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              canUseTextChat 
                ? "メッセージを入力..." 
                : "音声チャット中は使用できません"
            }
            disabled={!canUseTextChat || isProcessing}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          
          <Button
            type="submit"
            disabled={!input.trim() || !canUseTextChat || isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600/90 hover:bg-blue-700/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">送信中...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span className="text-sm">送信</span>
              </>
            )}
          </Button>
        </form>

        {/* ステータス表示 */}
        <div className="mt-2 text-xs text-center">
          {!canUseTextChat ? (
            <span className="text-yellow-400">
              音声チャット中 ({voiceChatStatus})
            </span>
          ) : isProcessing ? (
            <span className="text-blue-400">AI応答生成中...</span>
          ) : (
            <span className="text-gray-400">
              Enterで送信
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 