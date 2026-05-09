# Supabase セットアップ手順

このサイトはSupabase未設定でもダミーデータで動作します。本番DBに繋ぐ場合は以下を実施してください。

## 1. プロジェクト作成

1. [supabase.com](https://supabase.com) にログイン
2. **New project**
   - Name: `class-dining` (任意)
   - Database password: 強力なパスワードを生成してメモ
   - Region: **Northeast Asia (Tokyo)** を選択
3. プロジェクト作成完了まで数分待つ

## 2. 環境変数の取得

プロジェクトダッシュボード → 左サイドバー **Settings** → **API** から以下を取得：

| 環境変数名 | 値 (Supabase上の項目) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` `secret`（**絶対に公開しない**） |

## 3. .env.local に設定

プロジェクトルートの `.env.local` を編集：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

## 4. スキーマ + Seed の投入

Supabaseダッシュボード → 左サイドバー **SQL Editor** → **New query**

1. `db/schema.sql` の内容を全文コピペ → **Run**
2. 続けて新しいクエリで `db/seed.sql` の内容をコピペ → **Run**

これで `restaurants` `genres` `features` テーブルが作成され、ダミー5店舗が投入されます。

## 5. 管理者ユーザーの作成

Supabaseダッシュボード → **Authentication** → **Users** → **Add user** → **Create new user**

- Email: 自分のメール
- Password: 強力なパスワード
- **Auto Confirm User: ON**

## 6. dev サーバー再起動

`.env.local` 変更を反映するため：

```bash
# 既存のdevサーバーを Ctrl+C で停止
npm run dev
```

## 7. ログイン確認

`http://localhost:3210/login` でログイン → `http://localhost:3210/admin` に遷移すれば成功。

## トラブルシュート

- **`Supabase env vars missing`** → `.env.local` 設定後にdev再起動
- **管理画面で401/403** → RLSポリシーが効いている。Supabaseで該当ユーザーが `authenticated` ロールか確認
- **画像が表示されない** → `next.config.ts` の `remotePatterns` にホスト名を追加
