"use client";

import { useState, useTransition } from "react";
import {
  backfillAllGalleries,
  type BackfillResult,
} from "./backfill-actions";

const STATUS_LABEL: Record<BackfillResult["status"], string> = {
  ok: "追加",
  skipped: "スキップ",
  no_photos: "写真なし",
  error: "エラー",
};

const STATUS_COLOR: Record<BackfillResult["status"], string> = {
  ok: "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/40",
  skipped:
    "text-[color:var(--color-text-faded)] border-[color:var(--color-border)]",
  no_photos: "text-amber-400 border-amber-500/40",
  error: "text-red-400 border-red-500/40",
};

export function BulkBackfillButton() {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<BackfillResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function run() {
    if (
      !confirm(
        "全店舗のギャラリー写真を URL から自動取得します。\n各店舗の tabelog_url / google_map_url を順に叩くので、店舗数 × 数秒かかります。続行しますか？",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError(null);
      setResults(null);
      const res = await backfillAllGalleries();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.results);
      setOpen(true);
    });
  }

  const summary = results
    ? {
        ok: results.filter((r) => r.status === "ok").length,
        added: results.reduce((acc, r) => acc + r.added, 0),
        skipped: results.filter((r) => r.status === "skipped").length,
        noPhotos: results.filter((r) => r.status === "no_photos").length,
        errors: results.filter((r) => r.status === "error").length,
      }
    : null;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-block px-5 py-2.5 border border-[color:var(--color-gold)]/60 text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] text-xs tracking-[0.3em] transition-colors disabled:opacity-50"
        title="全店舗の tabelog_url / google_map_url から写真を自動取得して gallery_image_urls にマージします"
      >
        {pending
          ? "取得中... (画面を閉じないでください)"
          : "ギャラリーを一括自動取得"}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {summary && (
        <div className="w-full max-w-2xl border border-[color:var(--color-border-soft)] p-4 mt-2 text-xs space-y-2">
          <div className="flex flex-wrap gap-3 pb-3 border-b border-[color:var(--color-border-soft)]">
            <span className="text-[color:var(--color-gold)]">
              ✓ 追加 {summary.ok} 店舗 ({summary.added} 枚)
            </span>
            <span className="text-[color:var(--color-text-faded)]">
              スキップ {summary.skipped}
            </span>
            <span className="text-amber-400">写真なし {summary.noPhotos}</span>
            <span className="text-red-400">エラー {summary.errors}</span>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="ml-auto underline text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
            >
              {open ? "詳細を閉じる" : "詳細を見る"}
            </button>
          </div>
          {open && (
            <ul className="divide-y divide-[color:var(--color-border-soft)]">
              {results!.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 py-2 text-left"
                >
                  <span
                    className={`text-[10px] tracking-wider px-1.5 py-0.5 border whitespace-nowrap ${STATUS_COLOR[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                    {r.status === "ok" && ` +${r.added}`}
                  </span>
                  <span className="flex-1 min-w-0 truncate">{r.name}</span>
                  {r.reason && (
                    <span className="text-[10px] text-[color:var(--color-text-faded)] truncate max-w-[40%]">
                      {r.reason}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
