# 処理フロー

````mermaid
graph TD
    A["ユーザー入力<br/>（音声/テキスト）"] --> B["音声認識<br/>（Web Speech API）"]
    B --> C["AI処理<br/>（Gemini/OpenAI）"]
    A --> C
    C --> D["応答生成 + 感情タグ<br/>[emotion:happy:0.8]"]
    D --> E["感情解析<br/>（5種類の基本感情）"]
    D --> F["音声合成<br/>（VoiceVox）"]
    E --> G["アニメーション選択<br/>（感情別マッピング）"]
    G --> H["3Dモデル制御<br/>（VRM + Three.js）"]
    F --> I["音声出力<br/>（スピーカー）"]
    H --> J["リアルタイム表示<br/>（表情 + ジェスチャー）"]

    subgraph "感情システム"
        E --> E1["neutral - 平常状態"]
        E --> E2["happy - 喜び"]
        E --> E3["sad - 悲しみ"]
        E --> E4["angry - 怒り"]
        E --> E5["surprised - 驚き"]
    end

    subgraph "3Dアニメーション"
        H --> H1["表情アニメーション<br/>（ブレンドシェイプ）"]
        H --> H2["ジェスチャー<br/>（ボーンアニメーション）"]
        H --> H3["リップシンク<br/>（音声同期）"]
    end
    ```
````
