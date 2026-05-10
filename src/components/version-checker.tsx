"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 60 * 1000; // 60秒

type VersionInfo = { version: string; builtAt?: string };

export function VersionChecker() {
  const initialVersion =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_BUILD_VERSION ?? "dev"
      : "dev";
  const [latest, setLatest] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const res = await fetch("/api/version", {
          cache: "no-store",
          // タブが背景にいる間も走る
        });
        if (!res.ok) return;
        const data = (await res.json()) as VersionInfo;
        if (!alive) return;
        if (data.version && data.version !== initialVersion) {
          setLatest(data.version);
        }
      } catch {
        // ネットワークエラーは無視 (オフライン時など)
      }
    }

    // 初回は 5 秒後にチェック (起動直後の負荷回避)
    const initialTimer = setTimeout(check, 5000);
    const intervalTimer = setInterval(check, POLL_INTERVAL_MS);

    // タブがフォアグラウンドに戻ったら即チェック
    function onVisibilityChange() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [initialVersion]);

  if (!latest || dismissed) return null;

  function reload() {
    // Service worker を将来入れた時のために caches を破棄
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k));
      });
    }
    // 強制 reload (バイパス キャッシュ)
    window.location.reload();
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md"
    >
      <div className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-gold)] rounded-2xl p-4 shadow-[0_12px_40px_rgba(200,169,107,0.25)] flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[color:var(--color-gold)]">
            ✨ 新しいバージョンがあります
          </p>
          <p className="text-[10px] text-[color:var(--color-text-muted)] mt-0.5">
            {initialVersion} → {latest}
          </p>
        </div>
        <button
          onClick={reload}
          className="px-4 py-2 bg-[color:var(--color-gold)] text-[color:var(--color-bg)] text-xs tracking-[0.3em] font-bold rounded-full hover:bg-[color:var(--color-gold-soft)] transition-colors whitespace-nowrap"
        >
          更新
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="閉じる"
          className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
