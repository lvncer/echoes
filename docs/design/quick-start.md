# 感情システム クイックスタート

## 🎯 目標

LLM が文脈を理解して感情タグを生成し、UI で感情を表示する

## ⚡ 3 ステップで完了

### 1. 環境設定

```bash
npm install ai @ai-sdk/google zustand framer-motion
```

`.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 2. ファイル作成

以下の 5 ファイルを作成（コードは `llm-emotion-system-simple.md` 参照）:

- `src/lib/llm/emotion-service.ts` - LLM サービス
- `src/lib/stores/emotion-store.ts` - 状態管理
- `src/app/actions/emotion-actions.ts` - Server Action
- `src/components/emotion/emotion-display.tsx` - 感情表示
- `src/components/chat/emotion-chat.tsx` - メインチャット

### 3. 使用

```typescript
// src/app/page.tsx
import { EmotionChat } from "@/components/chat/emotion-chat";

export default function Home() {
  return <EmotionChat />;
}
```

## ✅ 完了

チャットで「嬉しい！」と入力すると、AI が `[emotion:happy:0.8]` タグ付きで応答し、感情表示が更新される

---

**所要時間**: 30 分
**次**: 3D アバター統合
