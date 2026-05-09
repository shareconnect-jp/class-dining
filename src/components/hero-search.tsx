"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENRES, PREFECTURES } from "@/lib/types";

const SCENES = [
  "役員接待",
  "海外ゲスト",
  "金融会食",
  "出張アテンド",
  "二次会",
];

export function HeroSearch() {
  const router = useRouter();
  const [pref, setPref] = useState(PREFECTURES[0].slug);
  const [genre, setGenre] = useState(GENRES[0].slug);
  const [scene, setScene] = useState(SCENES[0]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${pref}/${genre}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-[rgba(18,18,18,0.82)] border border-white/10 rounded-3xl p-3 sm:p-[18px] grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-3 max-w-[860px] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
    >
      <SelectBox label="AREA" value={pref} onChange={setPref}>
        {PREFECTURES.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </SelectBox>
      <SelectBox label="GENRE" value={genre} onChange={setGenre}>
        {GENRES.map((g) => (
          <option key={g.slug} value={g.slug}>
            {g.name}
          </option>
        ))}
      </SelectBox>
      <SelectBox label="SCENE" value={scene} onChange={setScene}>
        {SCENES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectBox>
      <button
        type="submit"
        className="col-span-2 sm:col-span-1 bg-[color:var(--color-gold)] hover:bg-[color:var(--color-gold-soft)] transition-colors rounded-2xl px-7 py-3 text-[color:var(--color-bg)] font-black text-sm tracking-wider"
      >
        検索
      </button>
    </form>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="bg-[#0d0d0d] border border-white/10 rounded-2xl px-4 py-3 cursor-pointer block">
      <span className="block text-[10px] text-[#777] tracking-widest mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-[#ddd] w-full outline-none cursor-pointer appearance-none"
      >
        {children}
      </select>
    </label>
  );
}
