"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAIStore } from "@/lib/stores/ai-store";
import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";

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
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading, lastAIMessage } = useAIStore();
  const prevLastAIMessageId = useRef<string | null>(null);

  useEffect(() => {
    setIsProcessing(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (
      lastAIMessage &&
      lastAIMessage.id !== prevLastAIMessageId.current &&
      lastAIMessage.role === "assistant" &&
      !lastAIMessage.isError &&
      !isVoiceChatActive // 音声チャットが有効でない場合のみリップシンクを実行
    ) {
      integratedLipSyncService.startAIResponseLipSync(lastAIMessage.content);
      prevLastAIMessageId.current = lastAIMessage.id;
    }
  }, [lastAIMessage, isVoiceChatActive]);

  const canUseTextChat =
    !isVoiceChatActive || (isVoiceChatActive && voiceChatStatus === "idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !canUseTextChat || isProcessing) return;

    setIsProcessing(true);
    const messageText = input.trim();
    setInput("");

    try {
      await sendMessage(messageText, true);
    } catch (error) {
      console.error("テキストチャット送信エラー:", error);
      setIsProcessing(false); // エラー時は手動で解除
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 ${className}`}
    >
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={!canUseTextChat ? "音声入力中" : "..."}
        disabled={!canUseTextChat || isProcessing}
        className="w-48 h-16 px-4 bg-gray-800/90 backdrop-blur-xl border-2 border-gray-600/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={!input.trim() || !canUseTextChat || isProcessing}
        className="w-16 h-16 rounded-full bg-gray-800/90 hover:bg-gray-700/90 border-2 border-gray-600/50 shadow-lg disabled:opacity-50 flex items-center justify-center"
      >
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-6 h-6 text-white" />
        )}
      </Button>
    </form>
  );
}
