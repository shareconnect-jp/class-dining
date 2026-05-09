# デプロイ手順 (GitHub + Vercel)

## A. GitHub にプッシュ

### 1. リポジトリ作成

GitHubで新規リポジトリ作成。推奨設定：

- 名前: `class-dining`
- 所属: 株式会社シェアコネクト名義の新orgか、個人 (Aladdin の `seishokai` org とは別事業のため別管理推奨)
- Visibility: **Private** (公開前は private 推奨)
- 「Add a README」「Add .gitignore」「Add a license」は **OFF** (既にローカルにあるため)

### 2. リモート登録 + push

`<your-org>` と `<repo>` を置き換え：

```bash
cd C:/Users/USER/Downloads/class-dining
git remote add origin https://github.com/<your-org>/<repo>.git
git branch -M main
git push -u origin main
```

## B. Vercel にデプロイ

### 1. プロジェクトインポート

1. [vercel.com/new](https://vercel.com/new) にアクセス
2. GitHubアカウント連携 (初回のみ)
3. `class-dining` リポジトリを **Import**
4. Framework Preset: **Next.js** (自動検出)
5. Root Directory: `./` のまま
6. Build Command, Output Directory, Install Command: デフォルトでOK

### 2. 環境変数の設定 (Deployクリック前に)

**Environment Variables** セクションで以下を追加：

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | **Production のみ** (推奨) |

### 3. Deploy

**Deploy** クリック → 数分でビルド完了 → Vercel発行のURLが表示される。

## C. 独自ドメイン設定

### 1. ドメイン取得

未取得の場合、以下のいずれかで取得：

- お名前.com
- Cloudflare Registrar (推奨、原価+ドメイン管理機能良い)
- Vercelで直接購入 (DNS設定が一番簡単)

候補: `classdining.jp` / `class-dining.com` / `classdining.tokyo`

> ⚠️ **Meta広告制約**: dental等の医療系ワードを含めない (Yoyaqの方針と同じ。今回は問題なし)

### 2. Vercelに紐付け

Vercelプロジェクト → **Settings** → **Domains** → ドメイン入力 → **Add**

→ 表示されるDNSレコード (CNAMEまたはAレコード) をレジストラ側で設定。

### 3. メタデータ更新

`src/app/layout.tsx` の `metadataBase` を本番ドメインに変更：

```ts
metadataBase: new URL("https://class-dining.com"),
```

## D. デプロイ後の確認

- [ ] `/` が表示される
- [ ] `/restaurants` で店舗一覧表示
- [ ] `/tokyo/sushi` で SEO ページ表示
- [ ] `/login` から管理ログイン → `/admin` 遷移
- [ ] 管理画面で店舗追加 → 公開トグル → サイト側に反映

## E. SEO

- `metadataBase` を本番ドメインに更新後、Google Search Console に登録
- `/tokyo/sushi` 等は `generateStaticParams` で静的生成済み (84パターン = 7都道府県 × 12ジャンル)
- AdSense は記事15-20本投入後に申請 (メモリ「グルメ旅行サイト構想」参照)
