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
