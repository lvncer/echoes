import { EmotionChat } from "@/components/chat/emotion-chat";

export default function EmotionTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        感情システムテスト
      </h1>
      <EmotionChat />
    </div>
  );
}
