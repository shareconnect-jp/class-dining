import Link from "next/link";
import { fetchAllRestaurants } from "@/lib/data";

export default async function AdminDashboardPage() {
  const restaurants = await fetchAllRestaurants();
  const published = restaurants.filter((r) => r.is_published).length;
  const drafts = restaurants.length - published;

  return (
    <div className="p-10">
      <header className="mb-12 pb-8 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          DASHBOARD
        </p>
        <h1 className="font-serif text-3xl">概要</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Stat label="店舗総数" value={restaurants.length} />
        <Stat label="公開中" value={published} />
        <Stat label="下書き" value={drafts} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm tracking-[0.3em] text-[color:var(--color-gold)]">
            QUICK ACTIONS
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/quick-add"
            className="luxury-card block p-6 hover:border-[color:var(--color-gold)] bg-gradient-to-br from-[color:var(--color-gold)]/15 to-transparent border-[color:var(--color-gold)]/40"
          >
            <p className="text-xs text-[color:var(--color-gold)] mb-2 tracking-widest font-bold">
              ✨ QUICK ADD
            </p>
            <p className="font-serif text-lg">取材投稿 (URL貼ってAIに任せる)</p>
            <p className="text-[10px] text-[color:var(--color-text-muted)] mt-2">
              食べログ URL → AI が自動で記事化
            </p>
          </Link>
          <Link
            href="/admin/restaurants"
            className="luxury-card block p-6 hover:border-[color:var(--color-gold)]"
          >
            <p className="text-xs text-[color:var(--color-gold)] mb-2 tracking-widest">
              LIST
            </p>
            <p className="font-serif text-lg">店舗一覧・編集</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="luxury-card p-6">
      <p className="text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] mb-3">
        {label}
      </p>
      <p className="font-serif text-4xl text-gold-gradient">{value}</p>
    </div>
  );
}
