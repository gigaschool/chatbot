# Gemini Local Chatbot

ローカルで動作するGemini APIチャットボットです。APIキーをブラウザのlocalStorageに保存して、すべての会話がローカルで管理されます。

## デモ

**見本URL**: https://gigaschool.github.io/chatbot/

## 特徴

- 🚀 **シンプルで使いやすい**: 最小限のUIで直感的に操作
- 💾 **ローカル保存**: API キー、カスタムインストラクション、会話履歴すべてをブラウザに保存
- ⚙️ **カスタマイズ可能**: システムインストラクションで Gemini の振る舞いを細かく調整
- 📊 **ログ書き出し**: API リクエスト・レスポンスをJSON形式で保存・確認
- 📱 **レスポンシブ**: デスクトップ・タブレット・スマートフォン対応

## 使い方

### 1. APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/api-keys) にアクセス
2. 「Create API Key」ボタンをクリック
3. 「In a new project」または既存プロジェクトを選択
4. 生成されたAPIキーをコピー

### 2. チャットボットの使用

1. **見本URL** にアクセス: https://gigaschool.github.io/chatbot/
2. メニューボタン (☰) をクリックして設定パネルを開く
3. 取得したAPIキーを「Gemini API キー」フィールドに入力
4. （オプション）「カスタムインストラクション」で Gemini の動作を指定
   - 例: 「あなたは日本語で簡潔に回答するアシスタントです。」
5. 「保存」ボタンをクリック
6. メッセージを入力して「送信」ボタンをクリック

### 3. 主な機能

| 機能 | 説明 |
|------|------|
| **API キー入力** | Gemini API キーを入力・保存 |
| **カスタムインストラクション** | Gemini の返答スタイルをカスタマイズ |
| **ログを書き出し** | API リクエスト・レスポンスをJSON形式で保存 |
| **会話を消去** | チャット履歴とログをクリア（APIキーは保持） |
| **全データ削除** | 保存されたすべてのデータを削除 |

## セキュリティに関する注意

⚠️ **重要**: 
- **API キーはブラウザの localStorage に平文で保存されます**
- 信頼できるデバイスでのみ使用してください
- 不正使用を防ぐため、APIキーが漏洩した場合は即座に [Google AI Studio](https://aistudio.google.com/api-keys) で無効化してください
- 公開パソコンでの使用は避けてください

## ローカル開発

```bash
# リポジトリをクローン
git clone <repository-url>
cd chatbot

# ローカルサーバーで実行
python -m http.server 8000
# または
npx http-server
```

`http://localhost:8000` でアクセス可能です。

## ファイル構成

```
├── index.html        # HTMLマークアップ
├── script.js         # JavaScript（API通信、状態管理）
├── styles.css        # スタイルシート
└── README.md         # このファイル
```

## 仕様

- **モデル**: `gemini-flash-latest`
- **API**: Google Generative AI API
- **保存先**: ブラウザ localStorage
- **対応ブラウザ**: Chrome, Firefox, Safari, Edge など（最新版推奨）

## トラブルシューティング

### APIキーが無効というエラーが出る
- APIキーが正しくコピーされているか確認
- [Google AI Studio](https://aistudio.google.com/api-keys) でAPIキーが有効か確認
- 新しいAPIキーを生成して試す

### 応答がない
- インターネット接続を確認
- ブラウザのコンソール (F12) でエラーメッセージを確認
- キャッシュをクリアして再度試す

### localStorage が有効でない
- ブラウザの プライベート/シークレット モードでは localStorage が使用できません
- 通常モードで使用してください
- ブラウザの設定を確認し、ローカルストレージが有効になっているか確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、GitHubのIssueセクションで報告してください。
