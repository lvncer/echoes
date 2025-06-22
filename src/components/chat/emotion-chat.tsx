"use client";

import { useState } from "react";
import { useEmotionStore } from "@/lib/stores/emotion-store";
import { generateEmotionalResponse } from "@/app/actions/emotion-actions";
import { EmotionDisplay } from "@/components/emotion/emotion-display";

export function EmotionChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const { setEmotion, setProcessing } = useEmotionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, `You: ${input}`]);
    setProcessing(true);

    const result = await generateEmotionalResponse(input);

    if (result.success && result.data) {
      const { text, emotions } = result.data;
      if (emotions[0]) setEmotion(emotions[0]);
      setMessages((prev) => [...prev, `AI: ${text}`]);
    }

    setProcessing(false);
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <EmotionDisplay />

      <div className="h-64 overflow-y-auto border rounded p-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            {msg}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="メッセージを入力..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          送信
        </button>
      </form>
    </div>
  );
}
