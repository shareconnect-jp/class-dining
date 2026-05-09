import Link from "next/link";
import { fetchAllFeatures } from "@/lib/data";

export const metadata = { title: "特集管理" };

export default async function AdminFeaturesPage() {
  const features = await fetchAllFeatures();

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[color:var(--color-border-soft)]">
        <div>
          <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
            FEATURES
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl">特集管理</h1>
        </div>
        <Link
          href="/admin/features/new"
          className="inline-block self-start sm:self-auto px-5 py-2.5 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] text-xs tracking-[0.3em] transition-colors"
        >
          + 新規特集
        </Link>
      </header>

      {features.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[color:var(--color-text-muted)] mb-4">
            まだ特集がありません。
          </p>
          <Link
            href="/admin/features/new"
            className="text-xs tracking-widest text-[color:var(--color-gold)] hover:underline"
          >
            最初の特集を作る →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {features.map((f) => (
            <li
              key={f.id}
              className="luxury-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
            >
              {f.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.hero_image_url}
                  alt=""
                  className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base sm:text-lg truncate">
                  {f.title}
                </p>
                {f.subtitle && (
                  <p className="text-xs text-[color:var(--color-text-muted)] truncate mt-0.5">
                    {f.subtitle}
                  </p>
                )}
                <p className="text-[10px] text-[color:var(--color-text-faded)] mt-1">
                  {f.slug} ・ 紐付け店舗 {f.restaurant_ids?.length ?? 0} 件
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {f.is_published ? (
                  <span className="text-[10px] tracking-widest text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40 px-2 py-1 whitespace-nowrap">
                    公開
                  </span>
                ) : (
                  <span className="text-[10px] tracking-widest text-[color:var(--color-text-faded)] border border-[color:var(--color-border)] px-2 py-1 whitespace-nowrap">
                    下書き
                  </span>
                )}
                <Link
                  href={`/admin/features/${f.id}/edit`}
                  className="text-xs tracking-widest text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] whitespace-nowrap"
                >
                  編集 →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
