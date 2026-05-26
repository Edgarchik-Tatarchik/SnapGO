# サインレンズ / SignLens

**日本語の標識・看板をリアルタイムで認識・翻訳するPWAアプリ**  
**A PWA that reads and translates Japanese signs in real time**

🔗 **Live Demo:** [sign-lens-alpha.vercel.app](https://sign-lens-alpha.vercel.app)

---

## なぜ作ったのか / Why I Built This

日本に住む外国人として、街中の看板や標識が読めない場面に何度も直面しました。既存の翻訳アプリはテキスト入力が前提で、カメラで見たまま翻訳できるものは少ない。そのギャップを埋えるために作りました。

As a foreigner living in Japan, I constantly encountered signs and notices I couldn't read. Existing tools required typing — none let you simply point your camera and understand. I built SignLens to close that gap.

---

## 機能 / Features

| 機能 | 詳細 |
|------|------|
| 📷 カメラスキャン | ブラウザから直接カメラ起動、後カメ自動選択 |
| 🤖 AI OCR + 翻訳 | Claude Vision APIで文字認識と英訳を同時実行 |
| 💾 スキャン保存 | 履歴をSupabaseに保存、いつでも参照可能 |
| ✏️ 翻訳修正 | ユーザーが翻訳を修正→フィードバックループ形成 |
| 📱 PWA対応 | ホーム画面に追加でネイティブアプリのように動作 |
| 🔒 匿名認証 | アカウント登録不要、即座に使用可能 |

---

## 技術スタック / Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- i18next（日本語UI）

**AI / Backend**
- Claude Haiku API（Vision OCR + 日英翻訳）
- Vercel Edge Functions（APIプロキシ、CORSハンドリング）

**Infrastructure**
- Supabase（PostgreSQL + Auth + Storage）
- Row Level Security（ユーザーデータ分離）
- Vercel（静的ホスティング + CDN）

---

## アーキテクチャ / Architecture

```
[Camera/Upload]
      ↓
[React Frontend]
      ↓
[Vercel Edge Function]  ← APIキーをサーバー側で保護
      ↓
[Claude Haiku Vision API]  ← OCR + 翻訳を1リクエストで実行
      ↓
[Supabase]  ← 画像Storage + scans/corrections テーブル
      ↓
[Result Screen]  ← 原文・翻訳・修正フォームを表示
```

**設計上の判断 / Key Design Decisions:**
- クライアントサイドOCRではなくAPIを採用：精度とバンドルサイズのトレードオフを考慮
- Edge Functionでプロキシ：APIキーをブラウザに露出させない
- 匿名認証＋RLS：バックエンドサーバーなしでユーザーデータを安全に分離

---

## ローカル起動 / Local Setup

```bash
git clone https://github.com/Edgarchik-Tatarchik/SignLens.git
cd SignLens
npm install

# .env.local を作成
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

npm run dev
```

**Vercel Edge Function用の環境変数（サーバー側）:**
```
ANTHROPIC_API_KEY=your_anthropic_key
```

---


## 今後の改善点 / Future Improvements

- [ ] スキャン履歴の検索・フィルター機能
- [ ] 複数言語への翻訳対応

---

## 作者 / Author

**Edgar** — [GitHub](https://github.com/Edgarchik-Tatarchik)


