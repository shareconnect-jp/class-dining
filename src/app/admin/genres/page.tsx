import { GENRES } from "@/lib/types";

export const metadata = { title: "ジャンル管理" };

export default function AdminGenresPage() {
  return (
    <div className="p-10">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          GENRES
        </p>
        <h1 className="font-serif text-3xl">ジャンル管理</h1>
        <p className="text-xs text-[color:var(--color-text-muted)] mt-3">
          現在は src/lib/types.ts のマスタを表示しています。
          DBで動的に管理する場合は genres テーブルに対するCRUDを実装してください。
        </p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
        {GENRES.map((g) => (
          <div
            key={g.slug}
            className="luxury-card p-4 text-center"
          >
            <p className="font-serif text-lg">{g.name}</p>
            <p className="text-[10px] text-[color:var(--color-text-faded)] mt-1 tracking-widest">
              {g.slug}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
