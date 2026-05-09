"use client";

import { useState, useTransition } from "react";
import type { Restaurant } from "@/lib/types";
import { GENRES, PREFECTURES } from "@/lib/types";
import {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "./actions";

type Props = {
  initial?: Restaurant;
};

export function RestaurantForm({ initial }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateRestaurant(initial!.id, fd)
        : await createRestaurant(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  function handleDelete() {
    if (!initial) return;
    if (!confirm("本当に削除しますか？")) return;
    startTransition(async () => {
      const res = await deleteRestaurant(initial.id);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <Section title="基本情報">
        <Field label="店名 *">
          <input
            name="name"
            defaultValue={initial?.name}
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
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="都道府県 *">
            <select
              name="prefecture"
              defaultValue={initial?.prefecture ?? ""}
              required
              className={inputCls}
            >
              <option value="">選択</option>
              {PREFECTURES.map((p) => (
                <option key={p.slug} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ジャンル *">
            <select
              name="genre"
              defaultValue={initial?.genre ?? ""}
              required
              className={inputCls}
            >
              <option value="">選択</option>
              {GENRES.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="エリア (例: 銀座、北新地)">
          <input name="area" defaultValue={initial?.area ?? ""} className={inputCls} />
        </Field>
        <Field label="紹介文">
          <textarea
            name="description"
            defaultValue={initial?.description ?? ""}
            rows={4}
            className={inputCls}
          />
        </Field>
        <Field label="住所">
          <input
            name="address"
            defaultValue={initial?.address ?? ""}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="価格・URL">
        <div className="grid grid-cols-2 gap-4">
          <Field label="予算 下限 (円)">
            <input
              type="number"
              name="price_min"
              defaultValue={initial?.price_min ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="予算 上限 (円)">
            <input
              type="number"
              name="price_max"
              defaultValue={initial?.price_max ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="食べログ URL">
          <input
            type="url"
            name="tabelog_url"
            defaultValue={initial?.tabelog_url ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="公式サイト URL">
          <input
            type="url"
            name="official_url"
            defaultValue={initial?.official_url ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Google Map URL">
          <input
            type="url"
            name="google_map_url"
            defaultValue={initial?.google_map_url ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="メイン画像 URL">
          <input
            type="url"
            name="main_image_url"
            defaultValue={initial?.main_image_url ?? ""}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="特徴">
        <div className="grid grid-cols-3 gap-4">
          <Check
            name="private_room"
            label="個室あり"
            defaultChecked={initial?.private_room}
          />
          <Check
            name="vip_available"
            label="VIP対応"
            defaultChecked={initial?.vip_available}
          />
          <Check
            name="business_trip_friendly"
            label="出張向き"
            defaultChecked={initial?.business_trip_friendly}
          />
        </div>
        <Field label="客層 (カンマ区切り、例: 経営者,弁護士,医師)">
          <input
            name="customer_types"
            defaultValue={initial?.customer_types?.join(", ") ?? ""}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="スコア (1-5)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="接待">
            <input
              type="number"
              min={1}
              max={5}
              name="business_dining_score"
              defaultValue={initial?.business_dining_score ?? 3}
              className={inputCls}
            />
          </Field>
          <Field label="静かさ">
            <input
              type="number"
              min={1}
              max={5}
              name="quietness_score"
              defaultValue={initial?.quietness_score ?? 3}
              className={inputCls}
            />
          </Field>
          <Field label="会話">
            <input
              type="number"
              min={1}
              max={5}
              name="conversation_score"
              defaultValue={initial?.conversation_score ?? 3}
              className={inputCls}
            />
          </Field>
          <Field label="アクセス">
            <input
              type="number"
              min={1}
              max={5}
              name="access_score"
              defaultValue={initial?.access_score ?? 3}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="公開設定">
        <Check
          name="is_published"
          label="公開する"
          defaultChecked={initial?.is_published}
        />
      </Section>

      {error && (
        <p className="text-sm text-red-400 leading-relaxed">{error}</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
      <span className="text-sm text-[color:var(--color-text-muted)]">{label}</span>
    </label>
  );
}
