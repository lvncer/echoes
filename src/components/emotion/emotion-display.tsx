"use client";

import { motion } from "framer-motion";
import { useEmotionStore } from "@/lib/stores/emotion-store";

const EMOTION_CONFIG = {
  neutral: { color: "text-gray-500", icon: "😐" },
  happy: { color: "text-yellow-500", icon: "😊" },
  sad: { color: "text-blue-500", icon: "😢" },
  angry: { color: "text-red-500", icon: "😠" },
  surprised: { color: "text-purple-500", icon: "😲" },
};

export function EmotionDisplay() {
  const { currentEmotion, intensity, isProcessing } = useEmotionStore();
  const config = EMOTION_CONFIG[currentEmotion] || EMOTION_CONFIG.neutral;

  return (
    <motion.div
      className="flex items-center gap-4 p-4 border rounded-lg"
      animate={{
        scale: isProcessing ? [1, 1.05, 1] : 1,
        opacity: isProcessing ? 0.7 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-2xl">{config.icon}</div>
      <div className="flex-1">
        <div className={`font-semibold ${config.color}`}>{currentEmotion.toUpperCase()}</div>
        <div className="text-sm text-gray-600">強度: {(intensity * 100).toFixed(0)}%</div>
      </div>
      <motion.div className={`w-16 h-2 bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full ${config.color.replace("text-", "bg-")}`}
          initial={{ width: 0 }}
          animate={{ width: `${intensity * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </motion.div>
  );
}
