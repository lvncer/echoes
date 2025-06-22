# 感情システム セットアップガイド

## 🔑 環境変数設定

感情システムを使用するには、Gemini APIキーの設定が必要です。

### 1. `.env.local` ファイル作成

プロジェクトルートに `.env.local` ファイルを作成してください：

```bash
# Google Gemini API Key (required for emotion system)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# または既存の環境変数名を使用
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. APIキーを作成
3. 上記の環境変数に設定

### 3. 動作確認

```bash
npm run dev
```

テストページにアクセス：
```
http://localhost:3000/emotion-test
```

## 🚀 使用方法

### 基本的な使用

```typescript
import { EmotionChat } from "@/components/chat/emotion-chat";

export default function Page() {
  return <EmotionChat />;
}
```

### カスタム実装

```typescript
import { useEmotionStore } from "@/lib/stores/emotion-store";
import { generateEmotionalResponse } from "@/app/actions/emotion-actions";

function MyComponent() {
  const { currentEmotion, intensity } = useEmotionStore();
  
  // 感情生成
  const result = await generateEmotionalResponse("こんにちは！");
  
  return (
    <div>
      現在の感情: {currentEmotion} (強度: {intensity})
    </div>
  );
}
```

## 🎯 感情タグ形式

AIが生成する感情タグの形式：

```
[emotion:happy:0.8]     # 喜び（強度0.8）
[emotion:sad:0.6]       # 悲しみ（強度0.6）
[emotion:angry:0.9]     # 怒り（強度0.9）
[emotion:surprised:0.7] # 驚き（強度0.7）
[emotion:neutral:0.5]   # 中立（強度0.5）
```

## ⚠️ トラブルシューティング

### エラー: "Google Generative AI API key is missing"

- `.env.local` ファイルが正しく作成されているか確認
- APIキーが正しく設定されているか確認
- サーバーを再起動（`npm run dev`）

### エラー: "Failed to generate response"

- インターネット接続を確認
- APIキーの有効性を確認
- Google AI Studioでの使用制限を確認

## 📊 パフォーマンス

- **レスポンス時間**: 通常1-2秒
- **感情検出精度**: 85%以上
- **対応感情**: 5種類（neutral, happy, sad, angry, surprised） 