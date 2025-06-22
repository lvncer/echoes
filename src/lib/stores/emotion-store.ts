import { create } from "zustand";
import { EmotionTag, EmotionType } from "@/lib/llm/emotion-service";

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
      intensity: Math.max(0, Math.min(1, emotion.intensity)),
    }),

  setProcessing: (processing) => set({ isProcessing: processing }),
}));
