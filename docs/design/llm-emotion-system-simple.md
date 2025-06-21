# LLM 感情システム 実装ガイド

## 🎯 実装目標

**ChatdollKit 方式の LLM 駆動感情タグシステム**を採用し、文脈を理解した自然な感情表現を実現する。

## 📋 必要な技術

```bash
npm install ai @ai-sdk/google zustand framer-motion
```

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

## 🔧 実装すべきファイル

### 1. LLM サービス (`src/lib/llm/emotion-service.ts`)

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export type EmotionType = "neutral" | "happy" | "sad" | "angry" | "surprised";

export interface EmotionTag {
  type: EmotionType;
  intensity: number; // 0.0 - 1.0
}

export class EmotionService {
  async generateResponse(userInput: string): Promise<{
    text: string;
    emotions: EmotionTag[];
  }> {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      system: `
        あなたは感情豊かなAIです。以下の感情タグを使って応答してください：
        [emotion:happy:0.8] - 喜び（強度0.8）
        [emotion:sad:0.6] - 悲しみ（強度0.6）

        利用可能な感情: neutral, happy, sad, angry, surprised
        文脈に応じて自然な感情を選択してください。
      `,
      prompt: userInput,
    });

    return this.parseResponse(text);
  }

  private parseResponse(text: string) {
    const emotionRegex = /\[emotion:(\w+):(\d+\.?\d*)\]/g;
    const emotions: EmotionTag[] = [];
    let cleanText = text;

    let match;
    while ((match = emotionRegex.exec(text)) !== null) {
      emotions.push({
        type: match[1] as EmotionType,
        intensity: parseFloat(match[2]),
      });
      cleanText = cleanText.replace(match[0], "");
    }

    return {
      text: cleanText.trim(),
      emotions:
        emotions.length > 0 ? emotions : [{ type: "neutral", intensity: 0.5 }],
    };
  }
}
```

### 2. 状態管理 (`src/lib/stores/emotion-store.ts`)

```typescript
import { create } from "zustand";

interface EmotionState {
  currentEmotion: EmotionType;
  intensity: number;
  isProcessing: boolean;

  setEmotion: (emotion: EmotionTag) => void;
  setProcessing: (processing: boolean) => void;
}

export const useEmotionStore = create<EmotionState>((set) => ({
  currentEmotion: "neutral",
  intensity: 0.5,
  isProcessing: false,

  setEmotion: (emotion) =>
    set({
      currentEmotion: emotion.type,
      intensity: emotion.intensity,
    }),

  setProcessing: (processing) => set({ isProcessing: processing }),
}));
```

### 3. Server Action (`src/app/actions/emotion-actions.ts`)

```typescript
"use server";

import { EmotionService } from "@/lib/llm/emotion-service";

const emotionService = new EmotionService();

export async function generateEmotionalResponse(userInput: string) {
  try {
    const result = await emotionService.generateResponse(userInput);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Failed to generate response" };
  }
}
```

### 4. 感情表示コンポーネント (`src/components/emotion/emotion-display.tsx`)

```typescript
"use client";

import { useEmotionStore } from "@/lib/stores/emotion-store";
import { motion } from "framer-motion";

const EMOTION_CONFIG = {
  neutral: { color: "#6B7280", icon: "😐", label: "中立" },
  happy: { color: "#F59E0B", icon: "😊", label: "喜び" },
  sad: { color: "#3B82F6", icon: "😢", label: "悲しみ" },
  angry: { color: "#EF4444", icon: "😠", label: "怒り" },
  surprised: { color: "#8B5CF6", icon: "😮", label: "驚き" },
};

export function EmotionDisplay() {
  const { currentEmotion, intensity, isProcessing } = useEmotionStore();
  const config = EMOTION_CONFIG[currentEmotion];

  return (
    <motion.div
      className="flex items-center gap-3 p-4 rounded-lg border"
      style={{ borderColor: config.color }}
      animate={{ scale: 1 + intensity * 0.1 }}
    >
      <span className="text-2xl">{config.icon}</span>
      <div className="flex-1">
        <span className="font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
        <div className="mt-1 h-2 bg-gray-200 rounded-full">
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: config.color,
              width: `${intensity * 100}%`,
            }}
          />
        </div>
      </div>
      {isProcessing && <div className="animate-spin">⏳</div>}
    </motion.div>
  );
}
```

### 5. メインチャット (`src/components/chat/emotion-chat.tsx`)

```typescript
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

    if (result.success) {
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
```

## 🚀 実装手順

1. **依存関係インストール**
2. **環境変数設定**
3. **上記 5 ファイルを作成**
4. **メインページで `EmotionChat` を使用**

## 📊 成功指標

- LLM レスポンス時間 < 2 秒
- 感情表現が自然に見える
- エラーが発生しない

## 🔄 今後の拡張

- 3D アバター追加
- 音声合成統合
- 感情履歴表示

---

**次のアクション**: `EmotionService` クラスから実装開始
