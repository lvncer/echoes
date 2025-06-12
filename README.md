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
# Gemini API Configuration (推奨)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# AI Provider Settings (gemini | openai)
AI_PROVIDER=gemini

# Demo Mode (APIキーなしでテスト可能)
AI_DEMO_MODE=false
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## 🎭 リップシンク機能の使い方

### 基本的な使い方

1. **VRM モデルの読み込み**

   - **デフォルトモデル**: アプリ起動時に自動で「ニコニ立体ちゃん」が読み込まれます
   - **手動読み込み**: 設定タブの「デフォルトモデル」ボタンからも読み込み可能
   - **カスタムモデル**: 中央の 3D ビューアーエリアに、VRM/glTF/GLB ファイルをドラッグ&ドロップ
   - モデルが正常に読み込まれると、ブレンドシェイプが利用可能になります

2. **リップシンク機能の有効化**

   - 左側の「リップシンク制御」パネルから、お好みのモードを選択：
     - **基本リップシンク**: 音量ベースの簡単なリップシンク
     - **高精度リップシンク**: 15 音素解析による高精度リップシンク
     - **統合リップシンク**: AI 応答連動の自動リップシンク

3. **音声チャットでのリップシンク**
   - 右側の「音声」タブを選択
   - 「リップシンク連動」ボタン（😊 アイコン）を ON にする
   - 「録音開始」でマイク入力を開始
   - AI 応答時に自動でリップシンクアニメーションが実行されます

### リップシンクモード詳細

#### 基本リップシンク

- **用途**: 簡単な口パクアニメーション
- **仕組み**: マイク音量レベルに基づく口の開閉
- **設定**: 感度・応答性・音量閾値を調整可能

#### 高精度リップシンク

- **用途**: より自然なリップシンクアニメーション
- **仕組み**: 15 音素（あいうえお、子音等）の解析
- **特徴**: フォルマント解析による高精度な口の形制御

#### 統合リップシンク

- **用途**: AI 音声チャット専用の自動リップシンク
- **仕組み**: TTS 音声と同期したリップシンク + 感情表現
- **特徴**: AI 応答内容に基づく感情アニメーション

### トラブルシューティング

#### マイクアクセスエラー

```
マイクロフォンへのアクセスが拒否されました
```

→ ブラウザの設定でマイクアクセスを許可してください

#### VRM モデルが動かない

```
ブレンドシェイプが利用できません
```

→ VRM モデルにブレンドシェイプが含まれているか確認してください

#### リップシンクが遅延する

- デバッグパネル（右下）で「統合テスト実行」を試してください
- ブラウザのパフォーマンス設定を確認してください

### デバッグ機能

右下の「デバッグ」ボタンから、以下の情報を確認できます：

- システム状態（Web Audio API、VRM モデル対応状況）
- アクティブなリップシンクサービス
- リアルタイム音素解析結果
- パフォーマンス情報

## 🤖 AI 機能

### 現在サポートされているプロバイダー

- **Google Gemini** (gemini-1.5-flash, gemini-1.5-pro) - **推奨**
- **OpenAI** (gpt-3.5-turbo, gpt-4, gpt-4-turbo)

### 将来サポート予定

- **Anthropic Claude**
- **ローカル LLM** (Ollama 等)

### API キーの取得方法

#### Gemini API (推奨)

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Google アカウントでログイン
3. "Create API Key" をクリック
4. 生成されたキーを `.env.local` の `GEMINI_API_KEY` に設定

#### OpenAI API

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

- [x] **Phase 1**: 3D モデル表示・AI チャット機能・リファクタリング
- [x] **Phase 2**: 音声処理基盤（Web Speech API）
- [x] **Phase 3**: リップシンク・アニメーション
- [ ] **Phase 4**: 高度機能・設定画面・データ管理
- [ ] **Phase 5**: 音声処理拡張（OpenAI Whisper/TTS、VOICEVOX）
- [ ] **Phase 6**: ローカル LLM 対応

**現在の状況**: Phase 3 完了 - 3 つのリップシンクモード（基本・高精度・統合）、15 音素対応、AI 応答連動機能が利用可能

**詳細**: [要件定義書 - リップシンク機能使用ガイド](docs/requirements/ai-model-app.md#10-リップシンク機能使用ガイド)

## 🔧 トラブルシューティング

### API キーエラー

```markdown
Gemini API キーが設定されていません
```

→ `.env.local` ファイルに正しい `GEMINI_API_KEY` が設定されているか確認してください。

```markdown
OpenAI API キーが設定されていません
```

→ `.env.local` ファイルに正しい `OPENAI_API_KEY` が設定されているか確認してください。

### クォータ制限エラー

```markdown
OpenAI API のクォータ制限に達しました
```

→ [OpenAI Usage](https://platform.openai.com/usage) でクォータ状況を確認し、必要に応じて支払い情報を設定してください。

### デモモード

API キーなしでアプリケーションをテストしたい場合：

```bash
# .env.local に追加
AI_DEMO_MODE=true
```

デモモードでは、実際の AI 応答の代わりにモックレスポンスが返されます。

### 接続エラー

```marksown
AI からの応答がありません
```

→ インターネット接続と API キーの有効性を確認してください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
