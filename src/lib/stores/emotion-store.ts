import { create } from "zustand";
import type { EmotionType, EmotionTag } from "../llm/emotion-service";

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
