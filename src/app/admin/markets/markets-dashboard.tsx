"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { MarketIndex, Quote } from "@/lib/quotes";
import type { Account, Holding } from "@/lib/holdings";
import { createHolding, deleteHolding } from "./actions";

const POLL_MS = 20_000;

type Props = {
  indices: MarketIndex[];
  indexSymbols: string[];
  holdings: Holding[];
};

const ACCOUNT_LABEL: Record<Account, string> = {
  company: "会社",
  personal: "個人",
};

export function MarketsDashboard({ indices, indexSymbols, holdings }: Props) {
  const [account, setAccount] = useState<Account>("personal");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // ポーリング対象: 指標 + 全保有 (両アカウント分まとめて取得)
  const allSymbols = useMemo(() => {
    const set = new Set<string>(indexSymbols);
    holdings.forEach((h) => set.add(h.symbol));
    return Array.from(set);
  }, [indexSymbols, holdings]);

  const symbolsKey = allSymbols.join(",");

  const load = useCallback(async () => {
    if (allSymbols.length === 0) return;
    try {
      const res = await fetch(
        `/api/quotes?symbols=${encodeURIComponent(symbolsKey)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const json = (await res.json()) as {
          quotes: Quote[];
          fetchedAt: string;
        };
        const map: Record<string, Quote> = {};
        json.quotes.forEach((q) => {
          map[q.symbol] = q;
        });
        setQuotes(map);
        setFetchedAt(json.fetchedAt);
      }
    } catch {
      // ネットワーク失敗時は前回値を保持
    } finally {
      setLoading(false);
    }
  }, [allSymbols.length, symbolsKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // USD建ての円換算に使うレート
  const usdJpy = quotes["JPY=X"]?.price ?? null;

  const accountHoldings = holdings.filter((h) => h.account === account);

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8 pb-6 border-b border-[color:var(--color-border-soft)] flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
            MARKETS
          </p>
          <h1 className="font-serif text-3xl">マーケット</h1>
        </div>
        <div className="flex items-center gap-3">
          <UpdatedAt fetchedAt={fetchedAt} loading={loading} />
          <button
            onClick={load}
            className="text-[11px] tracking-[0.2em] px-3 py-2 border border-[color:var(--color-border)] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            更新
          </button>
        </div>
      </header>

      {/* マーケット指標 */}
      <section className="mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {indices.map((idx) => (
            <IndexCard
              key={idx.symbol}
              meta={idx}
              quote={quotes[idx.symbol]}
            />
          ))}
        </div>
      </section>

      {/* 会社 / 個人 切り替え */}
      <section>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="inline-flex border border-[color:var(--color-border)] rounded-full overflow-hidden">
            {(["company", "personal"] as Account[]).map((a) => (
              <button
                key={a}
                onClick={() => setAccount(a)}
                className={`px-6 py-2.5 text-sm tracking-[0.2em] transition-colors ${
                  account === a
                    ? "bg-[color:var(--color-gold)] text-[color:var(--color-bg)] font-bold"
                    : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
                }`}
              >
                {ACCOUNT_LABEL[a]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-[11px] tracking-[0.2em] px-4 py-2 border border-[color:var(--color-border)] hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            {editing ? "完了" : "銘柄を編集"}
          </button>
        </div>

        <HoldingsTable
          holdings={accountHoldings}
          quotes={quotes}
          usdJpy={usdJpy}
          editing={editing}
        />

        {editing && <AddHoldingForm account={account} onDone={load} />}
      </section>
    </div>
  );
}

/* ---------- マーケット指標カード ---------- */

function IndexCard({ meta, quote }: { meta: MarketIndex; quote?: Quote }) {
  const up = (quote?.change ?? 0) >= 0;
  const hasData = quote && quote.price != null && !quote.error;

  return (
    <div className="luxury-card p-4 sm:p-5">
      <p className="text-[13px] font-bold text-[color:var(--color-text)] truncate">
        {meta.label}
      </p>
      {meta.note && (
        <p className="text-[10px] text-[color:var(--color-text-faded)] tracking-wider mb-2 truncate">
          {meta.note}
        </p>
      )}
      {hasData ? (
        <>
          <p className="font-mono text-xl sm:text-2xl mt-2 mb-1">
            {fmtPrice(quote!.price!, quote!.currency)}
          </p>
          <div
            className={`flex items-center gap-1.5 text-sm font-mono ${
              up ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <span>{up ? "▲" : "▼"}</span>
            <span>{fmtSigned(quote!.change)}</span>
            <span>({fmtSigned(quote!.changePercent)}%)</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-[color:var(--color-text-faded)] mt-3">
          {quote?.error ? "取得不可" : "—"}
        </p>
      )}
    </div>
  );
}

/* ---------- 保有銘柄テーブル ---------- */

function HoldingsTable({
  holdings,
  quotes,
  usdJpy,
  editing,
}: {
  holdings: Holding[];
  quotes: Record<string, Quote>;
  usdJpy: number | null;
  editing: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (holdings.length === 0) {
    return (
      <div className="luxury-card p-10 text-center text-[color:var(--color-text-muted)] text-sm">
        保有銘柄がまだありません。「銘柄を編集」から追加してください。
      </div>
    );
  }

  // JPY はそのまま / USD はレート換算 / その他は換算不可 (null)
  const toJpy = (v: number | null, currency: string | null): number | null => {
    if (v == null) return null;
    if (currency === "JPY" || currency == null) return v;
    if (currency === "USD" && usdJpy != null) return v * usdJpy;
    return null;
  };

  const rows = holdings.map((h) => {
    const q = quotes[h.symbol];
    const price = q?.price ?? null;
    const currency = q?.currency ?? null;
    const value = price != null ? price * h.quantity : null;
    const cost = h.cost_basis != null ? h.cost_basis * h.quantity : null;
    const pl = value != null && cost != null ? value - cost : null;
    const plPct =
      pl != null && cost != null && cost !== 0 ? (pl / cost) * 100 : null;
    const valueJpy = toJpy(value, currency);
    const costJpy = toJpy(cost, currency);
    const unconverted = value != null && valueJpy == null;
    return { h, price, currency, value, pl, plPct, valueJpy, costJpy, unconverted };
  });

  const totalValueJpy = rows.reduce((s, r) => s + (r.valueJpy ?? 0), 0);
  const totalCostJpy = rows.reduce((s, r) => s + (r.costJpy ?? 0), 0);
  const hasUnconverted = rows.some((r) => r.unconverted);

  const totalPlJpy = totalValueJpy - totalCostJpy;
  const totalPlPct =
    totalCostJpy !== 0 ? (totalPlJpy / totalCostJpy) * 100 : null;

  return (
    <div className="luxury-card overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-[color:var(--color-text-faded)] text-[11px] tracking-[0.15em] border-b border-[color:var(--color-border-soft)]">
            <th className="text-left font-normal p-3 sm:p-4">銘柄</th>
            <th className="text-right font-normal p-3 sm:p-4">数量</th>
            <th className="text-right font-normal p-3 sm:p-4">取得単価</th>
            <th className="text-right font-normal p-3 sm:p-4">現在値</th>
            <th className="text-right font-normal p-3 sm:p-4">評価額</th>
            <th className="text-right font-normal p-3 sm:p-4">損益</th>
            {editing && <th className="p-3 sm:p-4" />}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ h, price, currency, value, pl, plPct }) => {
            const up = (pl ?? 0) >= 0;
            return (
              <tr
                key={h.id}
                className="border-b border-[color:var(--color-border-soft)] last:border-0"
              >
                <td className="p-3 sm:p-4">
                  <div className="font-medium text-[color:var(--color-text)]">
                    {h.name}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-text-faded)] font-mono">
                    {h.symbol}
                  </div>
                </td>
                <td className="p-3 sm:p-4 text-right font-mono">
                  {fmtNum(h.quantity)}
                </td>
                <td className="p-3 sm:p-4 text-right font-mono text-[color:var(--color-text-muted)]">
                  {h.cost_basis != null ? fmtPrice(h.cost_basis, currency) : "—"}
                </td>
                <td className="p-3 sm:p-4 text-right font-mono">
                  {price != null ? fmtPrice(price, currency) : "—"}
                </td>
                <td className="p-3 sm:p-4 text-right font-mono">
                  {value != null ? fmtPrice(value, currency) : "—"}
                </td>
                <td className="p-3 sm:p-4 text-right font-mono">
                  {pl != null ? (
                    <span className={up ? "text-emerald-400" : "text-red-400"}>
                      {fmtSigned(pl)}
                      {plPct != null && (
                        <span className="block text-[11px]">
                          {fmtSigned(plPct)}%
                        </span>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                {editing && (
                  <td className="p-3 sm:p-4 text-right">
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (!confirm(`「${h.name}」を削除しますか？`)) return;
                        startTransition(async () => {
                          await deleteHolding(h.id);
                        });
                      }}
                      className="text-[11px] text-red-400/80 hover:text-red-400 disabled:opacity-40"
                    >
                      削除
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-[color:var(--color-border)] font-mono">
            <td className="p-3 sm:p-4 text-[color:var(--color-text-muted)] text-xs tracking-wider">
              合計 (円換算)
            </td>
            <td colSpan={3} />
            <td className="p-3 sm:p-4 text-right text-base">
              {fmtPrice(totalValueJpy, "JPY")}
            </td>
            <td className="p-3 sm:p-4 text-right">
              <span
                className={
                  totalPlJpy >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {fmtSigned(totalPlJpy)}
                {totalPlPct != null && (
                  <span className="block text-[11px]">
                    {fmtSigned(totalPlPct)}%
                  </span>
                )}
              </span>
            </td>
            {editing && <td />}
          </tr>
        </tfoot>
      </table>
      {hasUnconverted && (
        <p className="px-4 py-2 text-[10px] text-[color:var(--color-text-faded)]">
          ※ 円・ドル以外の通貨建ては合計の円換算に含めていません。
        </p>
      )}
    </div>
  );
}

/* ---------- 銘柄追加フォーム ---------- */

function AddHoldingForm({
  account,
  onDone,
}: {
  account: Account;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        fd.set("account", account);
        startTransition(async () => {
          const res = await createHolding(fd);
          if (res.ok) {
            formRef.current?.reset();
            setError(null);
            onDone();
          } else {
            setError(res.error);
          }
        });
      }}
      className="luxury-card p-5 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
    >
      <Field label="シンボル" hint="例: 7203.T / AAPL">
        <input name="symbol" required className={inputCls} placeholder="AAPL" />
      </Field>
      <Field label="銘柄名">
        <input name="name" required className={inputCls} placeholder="Apple" />
      </Field>
      <Field label="数量">
        <input
          name="quantity"
          type="number"
          step="any"
          min="0"
          required
          className={inputCls}
          placeholder="100"
        />
      </Field>
      <Field label="取得単価" hint="任意 / 1株あたり">
        <input
          name="cost_basis"
          type="number"
          step="any"
          min="0"
          className={inputCls}
          placeholder="150"
        />
      </Field>
      <button
        type="submit"
        disabled={isPending}
        className="py-2.5 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-sm tracking-[0.2em] disabled:opacity-50"
      >
        {isPending ? "..." : `${ACCOUNT_LABEL[account]}に追加`}
      </button>
      {error && (
        <p className="text-xs text-red-400 sm:col-span-2 lg:col-span-5">
          {error}
        </p>
      )}
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-sm font-mono";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.2em] text-[color:var(--color-text-faded)] mb-1.5">
        {label}
        {hint && <span className="ml-1 normal-case">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/* ---------- 更新時刻 ---------- */

function UpdatedAt({
  fetchedAt,
  loading,
}: {
  fetchedAt: string | null;
  loading: boolean;
}) {
  if (loading && !fetchedAt) {
    return (
      <span className="text-[11px] text-[color:var(--color-text-faded)]">
        取得中…
      </span>
    );
  }
  if (!fetchedAt) return null;
  const t = new Date(fetchedAt).toLocaleTimeString("ja-JP");
  return (
    <span className="text-[11px] text-[color:var(--color-text-faded)] tracking-wider">
      最終更新 {t}
    </span>
  );
}

/* ---------- フォーマッタ ---------- */

function fmtPrice(v: number, currency: string | null): string {
  const isFx = currency == null;
  const digits = Math.abs(v) >= 1000 ? 2 : 4;
  const n = v.toLocaleString("ja-JP", {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: isFx ? digits : 2,
  });
  if (currency === "JPY") return `¥${n}`;
  if (currency === "USD") return `$${n}`;
  if (currency) return `${n} ${currency}`;
  return n;
}

function fmtSigned(v: number | null): string {
  if (v == null) return "—";
  const s = v.toLocaleString("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v >= 0 ? `+${s}` : s;
}

function fmtNum(v: number): string {
  return v.toLocaleString("ja-JP", { maximumFractionDigits: 4 });
}
