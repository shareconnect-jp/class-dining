"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  bulkImportRestaurants,
  type BulkImportRowResult,
} from "./actions";
import { parseBulkImportInput } from "./parse";

const STATUS_LABEL: Record<BulkImportRowResult["status"], string> = {
  ok: "登録",
  skipped: "スキップ",
  duplicate: "重複",
  error: "エラー",
};

const STATUS_COLOR: Record<BulkImportRowResult["status"], string> = {
  ok: "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/40",
  skipped:
    "text-[color:var(--color-text-faded)] border-[color:var(--color-border)]",
  duplicate: "text-amber-400 border-amber-500/40",
  error: "text-red-400 border-red-500/40",
};

const SAMPLE = `鉄板KITAZUMI\thttps://tabelog.com/aichi/A2301/A230103/23068153/
すし将\thttps://tabelog.com/aichi/A2301/A230104/23001091/`;

export function BulkImportClient() {
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState<BulkImportRowResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parseBulkImportInput(raw), [raw]);

  function run() {
    if (parsed.length === 0) {
      setError("入力から URL を 1 件も抽出できませんでした");
      return;
    }
    if (
      !confirm(
        `${parsed.length} 件を順に取り込みます。1 件あたり数秒かかります。続行しますか？`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError(null);
      setResults(null);
      const res = await bulkImportRestaurants(parsed);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.results);
    });
  }

  const summary = results
    ? {
        ok: results.filter((r) => r.status === "ok").length,
        duplicate: results.filter((r) => r.status === "duplicate").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs tracking-wider text-[color:var(--color-text-muted)] mb-2">
          入力 (店名 + 食べログ URL、1 行 1 店舗)
        </label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={12}
          placeholder={SAMPLE}
          disabled={pending}
          className="w-full px-3 py-2.5 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-sm font-mono whitespace-pre"
        />
        <p className="text-[11px] text-[color:var(--color-text-faded)] mt-2">
          {parsed.length} 件の URL を検出
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/admin/restaurants"
          className="text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
        >
          ← 一覧に戻る
        </Link>
        <button
          type="button"
          onClick={run}
          disabled={pending || parsed.length === 0}
          className="px-6 py-3 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] text-xs tracking-[0.3em] disabled:opacity-50 transition-colors"
        >
          {pending
            ? "登録中... (画面を閉じないでください)"
            : `一括登録を実行 (${parsed.length})`}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {summary && (
        <div className="border border-[color:var(--color-border-soft)] p-4 space-y-3">
          <div className="flex flex-wrap gap-3 pb-3 border-b border-[color:var(--color-border-soft)] text-xs">
            <span className="text-[color:var(--color-gold)]">
              ✓ 登録 {summary.ok}
            </span>
            <span className="text-amber-400">重複 {summary.duplicate}</span>
            <span className="text-[color:var(--color-text-faded)]">
              スキップ {summary.skipped}
            </span>
            <span className="text-red-400">エラー {summary.errors}</span>
          </div>
          <ul className="divide-y divide-[color:var(--color-border-soft)]">
            {results!.map((r, i) => (
              <li
                key={`${r.inputUrl}-${i}`}
                className="flex items-center gap-3 py-2 text-left text-xs"
              >
                <span
                  className={`shrink-0 text-[10px] tracking-wider px-1.5 py-0.5 border ${STATUS_COLOR[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{r.inputName}</p>
                  {r.reason && (
                    <p className="text-[10px] text-[color:var(--color-text-faded)] truncate">
                      {r.reason}
                    </p>
                  )}
                </div>
                {r.id && (
                  <Link
                    href={`/admin/restaurants/${r.id}/edit`}
                    className="shrink-0 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] underline"
                  >
                    編集
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
