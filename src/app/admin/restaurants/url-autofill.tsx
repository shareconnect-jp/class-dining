"use client";

import { useMemo, useState } from "react";
import type { RestaurantFormApply } from "@/lib/restaurant-scrape";
import { genreSlugToName } from "@/lib/types";

export type AutofillFieldKey =
  | "name"
  | "prefecture"
  | "area"
  | "genre"
  | "address"
  | "postal_code"
  | "phone"
  | "opening_hours"
  | "closed_days"
  | "lat"
  | "lng"
  | "price_min"
  | "price_max"
  | "price_range"
  | "tabelog_url"
  | "official_url"
  | "google_map_url"
  | "instagram_url"
  | "x_url"
  | "tiktok_url"
  | "line_url"
  | "main_image_url"
  | "gallery_image_urls";

export const AUTOFILL_FIELD_LABELS: Record<AutofillFieldKey, string> = {
  name: "店名",
  prefecture: "都道府県",
  area: "エリア",
  genre: "ジャンル",
  address: "住所",
  postal_code: "郵便番号",
  phone: "電話番号",
  opening_hours: "営業時間",
  closed_days: "定休日",
  lat: "緯度",
  lng: "経度",
  price_min: "予算 下限",
  price_max: "予算 上限",
  price_range: "価格帯",
  tabelog_url: "食べログ URL",
  official_url: "公式サイト",
  google_map_url: "Google Map URL",
  instagram_url: "Instagram URL",
  x_url: "X (Twitter) URL",
  tiktok_url: "TikTok URL",
  line_url: "LINE 公式 URL",
  main_image_url: "メイン画像 URL",
  gallery_image_urls: "ギャラリー写真",
};

export type AutofillSnapshot = Partial<
  Record<AutofillFieldKey, string | number | string[]>
>;

type ApiSource = "tabelog" | "google_maps" | "instagram" | "x" | "tiktok" | "line";

type ScrapeApiResponse =
  | {
      ok: true;
      source: ApiSource;
      data: Record<string, unknown>;
      apply: RestaurantFormApply;
      warnings?: string[];
    }
  | { ok: false; code: string; error: string };

const SOURCE_LABEL: Record<ApiSource, string> = {
  tabelog: "食べログ",
  google_maps: "Google Places",
  instagram: "Instagram",
  x: "X (Twitter)",
  tiktok: "TikTok",
  line: "LINE 公式",
};

type Props = {
  currentValues: Partial<Record<AutofillFieldKey, string>>;
  onApply: (snapshot: AutofillSnapshot, selected: Set<AutofillFieldKey>) => void;
  fieldLabels: Record<AutofillFieldKey, string>;
};

const FIELD_ORDER: AutofillFieldKey[] = [
  "name",
  "prefecture",
  "area",
  "genre",
  "postal_code",
  "address",
  "phone",
  "opening_hours",
  "closed_days",
  "lat",
  "lng",
  "price_range",
  "price_min",
  "price_max",
  "tabelog_url",
  "official_url",
  "google_map_url",
  "instagram_url",
  "x_url",
  "tiktok_url",
  "line_url",
  "main_image_url",
  "gallery_image_urls",
];

function applyToSnapshot(apply: RestaurantFormApply): AutofillSnapshot {
  const snap: AutofillSnapshot = {};
  for (const [k, v] of Object.entries(apply)) {
    if (v == null || v === "") continue;
    if (typeof v === "number" || typeof v === "string") {
      snap[k as AutofillFieldKey] = v;
    } else if (Array.isArray(v) && v.length > 0) {
      snap[k as AutofillFieldKey] = v.filter(
        (u): u is string => typeof u === "string" && u.length > 0,
      );
    }
  }
  return snap;
}

function displayValue(key: AutofillFieldKey, value: string | number): string {
  if (key === "genre" && typeof value === "string") {
    return `${genreSlugToName(value)} (${value})`;
  }
  return String(value);
}

export function UrlAutofillSection({
  currentValues,
  onApply,
  fieldLabels,
}: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<AutofillSnapshot | null>(null);
  const [source, setSource] = useState<ApiSource | null>(null);
  const [selected, setSelected] = useState<Set<AutofillFieldKey>>(new Set());

  const availableKeys = useMemo<AutofillFieldKey[]>(() => {
    if (!snapshot) return [];
    return FIELD_ORDER.filter((k) => snapshot[k] !== undefined);
  }, [snapshot]);

  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus("loading");
    setErrorMsg(null);
    setWarnings([]);
    setSnapshot(null);
    setSource(null);
    setSelected(new Set());

    let res: Response;
    try {
      res = await fetch("/api/admin/restaurants/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "ネットワークエラー");
      return;
    }

    let json: ScrapeApiResponse;
    try {
      json = (await res.json()) as ScrapeApiResponse;
    } catch {
      setStatus("error");
      setErrorMsg(`サーバ応答の解析に失敗しました (HTTP ${res.status})`);
      return;
    }

    if (!json.ok) {
      setStatus("error");
      setErrorMsg(json.error);
      return;
    }

    const snap = applyToSnapshot(json.apply);
    const initialSelected = new Set<AutofillFieldKey>(
      FIELD_ORDER.filter(
        (k) => snap[k] !== undefined && !currentValues[k],
      ),
    );
    setSnapshot(snap);
    setSource(json.source);
    setWarnings(json.warnings ?? []);
    setSelected(initialSelected);
    setStatus("ok");
  }

  function toggleField(key: AutofillFieldKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    if (!snapshot) return;
    setSelected(new Set(availableKeys));
  }
  function selectNone() {
    setSelected(new Set());
  }

  function handleApply() {
    if (!snapshot) return;
    onApply(snapshot, selected);
    setStatus("idle");
    setSnapshot(null);
    setSelected(new Set());
  }

  return (
    <section className="rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft,transparent)] p-5 space-y-4">
      <div>
        <h3 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-1">
          URL から自動入力
        </h3>
        <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
          食べログ / Google マップ / Instagram / X / TikTok / LINE 公式 の店舗 URL を貼り付けると、可能な範囲で店名・住所・電話番号などを取得します。SNS 系は og:* が出ない場合もあるので、リンクだけ反映されることがあります。保存前に必ず内容を確認してください。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="食べログ / Google マップ / Instagram / X / TikTok / LINE 公式 の URL"
          className="flex-1 px-3 py-2.5 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleFetch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={status === "loading" || !url.trim()}
          className="px-6 py-2.5 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-xs tracking-[0.3em] disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "解析中..." : "読み取る"}
        </button>
      </div>

      {status === "error" && errorMsg && (
        <p className="text-sm text-red-400 leading-relaxed">{errorMsg}</p>
      )}

      {status === "ok" && snapshot && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[color:var(--color-text-muted)] tracking-wider">
              SOURCE:
            </span>
            <span className="text-[color:var(--color-gold)] tracking-[0.2em]">
              {source ? SOURCE_LABEL[source] : ""}
            </span>
            <span className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={selectAll}
                className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] underline"
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] underline"
              >
                解除
              </button>
            </span>
          </div>

          {warnings.length > 0 && (
            <ul className="text-xs text-amber-400 leading-relaxed list-disc pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className="border border-[color:var(--color-border-soft)] divide-y divide-[color:var(--color-border-soft)]">
            {availableKeys.map((key) => {
              const newValue = snapshot[key];
              const isArrayField = Array.isArray(newValue);
              const current = currentValues[key];
              const willOverwrite =
                !isArrayField &&
                current &&
                current !== "" &&
                current !== String(newValue);
              return (
                <label
                  key={key}
                  className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-[color:var(--color-bg-soft,transparent)]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggleField(key)}
                    className="mt-1 w-4 h-4 accent-[color:var(--color-gold)] flex-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs tracking-wider text-[color:var(--color-text-muted)]">
                        {fieldLabels[key]}
                      </span>
                      {isArrayField && Array.isArray(newValue) && (
                        <span className="text-[10px] tracking-wider text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40 px-1.5 py-0.5">
                          {newValue.length} 枚を追加
                        </span>
                      )}
                      {willOverwrite && (
                        <span className="text-[10px] tracking-wider text-amber-500 border border-amber-500/40 px-1.5 py-0.5">
                          上書き
                        </span>
                      )}
                    </div>
                    {isArrayField && Array.isArray(newValue) ? (
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                        {newValue.slice(0, 16).map((u, i) => (
                          <div
                            key={`${u}-${i}`}
                            className="relative aspect-square overflow-hidden bg-[color:var(--color-bg)] border border-[color:var(--color-border-soft)]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={u}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {newValue.length > 16 && (
                          <div className="relative aspect-square flex items-center justify-center text-xs text-[color:var(--color-text-muted)] bg-[color:var(--color-bg)] border border-[color:var(--color-border-soft)]">
                            +{newValue.length - 16}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm break-words whitespace-pre-wrap mt-0.5">
                        {newValue !== undefined
                          ? displayValue(key, newValue as string | number)
                          : "—"}
                      </div>
                    )}
                    {willOverwrite && (
                      <div className="text-[11px] text-[color:var(--color-text-faded)] mt-1 line-through break-words">
                        {current}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setSnapshot(null);
              }}
              className="text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selected.size === 0}
              className="px-6 py-2.5 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-xs tracking-[0.3em] disabled:opacity-50"
            >
              フォームに反映 ({selected.size})
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
