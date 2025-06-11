# Echoes

3D モデル（アバター）と AI によるリアルタイム音声会話アプリケーション

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# AI Provider Settings
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## 🤖 AI 機能

### 現在サポートされているプロバイダー

- **OpenAI** (gpt-3.5-turbo, gpt-4, gpt-4-turbo)

### 将来サポート予定

- **Anthropic Claude**
- **ローカル LLM** (Ollama 等)

### API キーの取得方法

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成またはログイン
3. API Keys セクションで新しいキーを生成
4. 生成されたキーを `.env.local` の `OPENAI_API_KEY` に設定

## 📁 プロジェクト構造

```sh
src/
├── app/                 # Next.js App Router
├── components/          # Reactコンポーネント
├── lib/
│   ├── config/         # 設定管理
│   ├── services/       # API・ビジネスロジック
│   └── types/          # 型定義
└── stores/             # 状態管理 (Zustand)
```

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS
- **AI 連携**: OpenAI SDK
- **バリデーション**: Zod

## 📋 開発ロードマップ

- [x] **Phase 1**: OpenAI API 基本実装
- [ ] **Phase 2**: Web UI 設定画面
- [ ] **Phase 3**: 3D モデル表示
- [ ] **Phase 4**: 音声処理機能
- [ ] **Phase 5**: リップシンク
- [ ] **Phase 6**: ローカル LLM 対応

## 🔧 トラブルシューティング

### API キーエラー

```markdown
OpenAI API キーが設定されていません
```

→ `.env.local` ファイルに正しい `OPENAI_API_KEY` が設定されているか確認してください。

### 接続エラー

```marksown
AI からの応答がありません
```

→ インターネット接続と API キーの有効性を確認してください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
