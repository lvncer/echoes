# Echoes

![https://img.shields.io/github/license/lvncer/echoes](https://img.shields.io/github/license/lvncer/echoes)

3D モデル（アバター）と AI によるリアルタイム音声会話アプリケーション

## Quick Start

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

以下のコマンドを実行し、`.env.example`をコピーして、 `.env.local` ファイルを作成してください。

```bash
cp .env.example .emv.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## AI 機能

### 現在サポートされているプロバイダー

- **Google Gemini** (gemini-1.5-flash, gemini-1.5-pro) - **推奨**
- **OpenAI** (gpt-3.5-turbo, gpt-4, gpt-4-turbo)
