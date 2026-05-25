-- =================================================================
-- マーケット ダッシュボード: 保有銘柄テーブル v1
-- Supabase SQL Editor にコピペで実行
--
-- 価格はリアルタイムに Yahoo Finance から取得するため保存しない。
-- ここに保存するのは「何を・何株・いくらで買ったか」の保有情報のみ。
-- account = 'company'(会社) / 'personal'(個人) で切り替え表示する。
-- =================================================================

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  account text not null default 'personal' check (account in ('company', 'personal')),
  symbol text not null,            -- Yahoo Finance シンボル (例: 7203.T, AAPL, ^N225)
  name text not null,              -- 表示名 (例: トヨタ自動車)
  quantity numeric not null default 0,        -- 保有数量 (株/口)
  cost_basis numeric,              -- 取得単価 (1株あたり、シンボルの通貨建て)
  memo text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists holdings_account_idx
  on public.holdings (account, sort_order);

-- updated_at 自動更新 (schema.sql の set_updated_at を再利用)
drop trigger if exists trg_holdings_updated_at on public.holdings;
create trigger trg_holdings_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: 資産情報なので公開 read は無し。認証ユーザーのみ全操作可。
-- (管理画面は service_role / 認証セッション経由でアクセス)
-- ============================================================
alter table public.holdings enable row level security;

drop policy if exists "authed full access holdings" on public.holdings;
create policy "authed full access holdings"
  on public.holdings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
