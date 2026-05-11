"use client";

import { useState, useTransition } from "react";
import { publishAllDrafts } from "./backfill-actions";

export function PublishAllDraftsButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { published: number; names: string[] }
    | { error: string }
    | null
  >(null);

  function run() {
    if (
      !confirm(
        "下書き状態の店舗をすべて公開します。\n(個別に下書きにしたい店舗はあとで編集画面から戻せます)\n続行しますか？",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setResult(null);
      const res = await publishAllDrafts();
      if (!res.ok) {
        setResult({ error: res.error });
      } else {
        setResult({ published: res.published, names: res.names });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-block px-5 py-2.5 border border-[color:var(--color-gold)]/60 text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] text-xs tracking-[0.3em] transition-colors disabled:opacity-50"
      >
        {pending ? "公開中..." : "下書きを一括公開"}
      </button>
      {result && "error" in result && (
        <p className="text-xs text-red-400">{result.error}</p>
      )}
      {result && "published" in result && (
        <p className="text-xs text-[color:var(--color-gold)]">
          {result.published === 0
            ? "下書きはありませんでした"
            : `${result.published} 店舗を公開しました`}
        </p>
      )}
    </div>
  );
}
