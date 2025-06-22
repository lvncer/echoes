# Emotion System セットアップガイド

## 1. 環境変数設定

`.env.local` ファイルに以下を追加：

```env
# Google Gemini API Key（どちらか一方を設定）
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
# または
GEMINI_API_KEY=your_api_key_here
```

## 2. 依存関係

以下のパッケージが必要です（すでにインストール済み）：

- `@ai-sdk/google`
- `ai`
- `framer-motion`

## 3. 基本的な使用方法

### チャットコンポーネント

```tsx
import { EmotionChat } from "@/components/chat/emotion-chat";

export default function Page() {
  return <EmotionChat />;
}
```

### テストページ

```text
http://localhost:3000/emotion-test
```

## 4. 動作確認

1. 開発サーバーを起動
2. `/emotion-test` にアクセス
3. 「嬉しい！」などのメッセージを送信
4. AI が感情タグ付きで応答することを確認

## 5. トラブルシューティング

### API キーエラー

```
Error: Gemini API key is not configured
```

→ `.env.local` に `GOOGLE_GENERATIVE_AI_API_KEY` または `GEMINI_API_KEY` を設定

### ビルドエラー

```
Module not found: @ai-sdk/google
```

→ `npm install @ai-sdk/google ai framer-motion`

### 感情が表示されない

- AI の応答に感情タグが含まれているか確認
- コンソールエラーをチェック

## 6. 感情タグ形式

```text
[emotion:happy:0.8]
[emotion:sad:0.6]
[emotion:angry:0.9]
[emotion:surprised:0.7]
[emotion:neutral:0.5]
```

## 7. カスタマイズ

- 感情の種類: `src/lib/llm/emotion-service.ts`
- UI デザイン: `src/components/emotion/emotion-display.tsx`
- アニメーション: Framer Motion の設定を調整
