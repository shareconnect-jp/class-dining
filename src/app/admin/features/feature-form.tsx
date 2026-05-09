"use client";

import { useMemo, useState, useTransition } from "react";
import type { Feature, Restaurant } from "@/lib/types";
import { genreSlugToName } from "@/lib/types";
import {
  createFeature,
  updateFeature,
  deleteFeature,
} from "./actions";

type Props = {
  initial?: Feature;
  restaurants: Restaurant[];
};

export function FeatureForm({ initial, restaurants }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.restaurant_ids ?? [],
  );
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const isEdit = Boolean(initial);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearch.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.prefecture ?? "").toLowerCase().includes(q) ||
        (r.area ?? "").toLowerCase().includes(q) ||
        (r.genre ?? "").toLowerCase().includes(q),
    );
  }, [restaurants, restaurantSearch]);

  function toggleId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function moveId(id: string, dir: -1 | 1) {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    // selectedIds は順序を保ってFormDataに乗せ直す (チェックボックスは順序不定なため)
    fd.delete("restaurant_ids");
    selectedIds.forEach((id) => fd.append("restaurant_ids", id));
    startTransition(async () => {
      const res = isEdit
        ? await updateFeature(initial!.id, fd)
        : await createFeature(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  function handleDelete() {
    if (!initial) return;
    if (!confirm("本当に削除しますか?")) return;
    startTransition(async () => {
      const res = await deleteFeature(initial.id);
      if (res && !res.ok) setError(res.error);
    });
  }

  const restaurantById = useMemo(
    () => new Map(restaurants.map((r) => [r.id, r])),
    [restaurants],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <Section title="基本情報">
        <Field label="タイトル *">
          <input
            name="title"
            defaultValue={initial?.title}
            required
            className={inputCls}
          />
        </Field>
        <Field label="slug * (URL用、英数とハイフン)">
          <input
            name="slug"
            defaultValue={initial?.slug}
            required
            pattern="[a-z0-9\-]+"
            placeholder="例: tokyo-sushi-best-5"
            className={inputCls}
          />
        </Field>
        <Field label="サブタイトル">
          <input
            name="subtitle"
            defaultValue={initial?.subtitle ?? ""}
            placeholder="例: 外資系役員接待で選ばれる、東京の鮨。"
            className={inputCls}
          />
        </Field>
        <Field label="ヒーロー画像 URL">
          <input
            type="url"
            name="hero_image_url"
            defaultValue={initial?.hero_image_url ?? ""}
            placeholder="https://images.unsplash.com/..."
            className={inputCls}
          />
        </Field>
        <Field label="本文 (Markdown 対応)">
          <textarea
            name="body_md"
            defaultValue={initial?.body_md ?? ""}
            rows={14}
            placeholder={"# 見出し\n\n本文です。**太字** や [リンク](https://example.com) も使えます。\n\n## 小見出し\n\n- 箇条書き\n- も書けます"}
            className={`${inputCls} font-mono text-sm`}
          />
        </Field>
      </Section>

      <Section title="紐付ける店舗">
        <p className="text-xs text-[color:var(--color-text-muted)] mb-3">
          現在 <b>{selectedIds.length}</b> 件選択中。順序が記事の表示順になります。
        </p>

        {/* 選択済み (順序付き) */}
        {selectedIds.length > 0 && (
          <div className="mb-5 space-y-2">
            {selectedIds.map((id, i) => {
              const r = restaurantById.get(id);
              if (!r) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-gold)]/30"
                >
                  <span className="text-xs text-[color:var(--color-gold)] font-bold w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm truncate">{r.name}</p>
                    <p className="text-[10px] text-[color:var(--color-text-faded)]">
                      {r.prefecture} {r.area} / {genreSlugToName(r.genre ?? "")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveId(id, -1)}
                    disabled={i === 0}
                    className="text-xs px-2 py-1 disabled:opacity-30 hover:text-[color:var(--color-gold)]"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveId(id, 1)}
                    disabled={i === selectedIds.length - 1}
                    className="text-xs px-2 py-1 disabled:opacity-30 hover:text-[color:var(--color-gold)]"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleId(id)}
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <input
          type="text"
          value={restaurantSearch}
          onChange={(e) => setRestaurantSearch(e.target.value)}
          placeholder="店舗を検索 (店名/エリア/ジャンル)"
          className={`${inputCls} mb-3`}
        />
        <div className="border border-[color:var(--color-border-soft)] max-h-72 overflow-y-auto divide-y divide-[color:var(--color-border-soft)]">
          {filteredRestaurants.length === 0 ? (
            <p className="p-4 text-xs text-[color:var(--color-text-muted)] text-center">
              該当なし
            </p>
          ) : (
            filteredRestaurants.map((r) => {
              const checked = selectedIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[color:var(--color-bg-elevated)] ${
                    checked ? "bg-[color:var(--color-bg-elevated)]" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId(r.id)}
                    className="w-4 h-4 accent-[color:var(--color-gold)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.name}</p>
                    <p className="text-[10px] text-[color:var(--color-text-faded)]">
                      {r.prefecture} {r.area} / {genreSlugToName(r.genre ?? "")}
                      {!r.is_published && " ・ 下書き"}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </Section>

      <Section title="公開設定">
        <Check
          name="is_published"
          label="公開する"
          defaultChecked={initial?.is_published}
        />
        <p className="text-xs text-[color:var(--color-text-muted)] mt-2">
          初公開時に published_at が自動セットされます。下書きに戻すと published_at はクリア。
        </p>
      </Section>

      {error && (
        <p className="text-sm text-red-400 leading-relaxed whitespace-pre-wrap">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 pt-6 border-t border-[color:var(--color-border-soft)]">
        <button
          type="submit"
          disabled={pending}
          className="px-8 py-3 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-sm tracking-[0.3em] disabled:opacity-50"
        >
          {pending ? "..." : isEdit ? "更新" : "作成"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="px-8 py-3 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm tracking-[0.3em] disabled:opacity-50 ml-auto"
          >
            削除
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-sm";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] pb-3 border-b border-[color:var(--color-border-soft)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs tracking-wider text-[color:var(--color-text-muted)] mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 accent-[color:var(--color-gold)]"
      />
      <span className="text-sm text-[color:var(--color-text-muted)]">
        {label}
      </span>
    </label>
  );
}
