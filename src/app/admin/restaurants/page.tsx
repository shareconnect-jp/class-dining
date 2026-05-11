import Link from "next/link";
import { fetchAllRestaurants } from "@/lib/data";
import { genreSlugToName } from "@/lib/types";
import { BulkBackfillButton } from "./bulk-backfill-button";

export default async function AdminRestaurantsListPage() {
  const restaurants = await fetchAllRestaurants();

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[color:var(--color-border-soft)]">
        <div>
          <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
            RESTAURANTS
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl">店舗一覧</h1>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <Link
            href="/admin/restaurants/new"
            className="inline-block self-start sm:self-auto px-5 py-2.5 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] text-xs tracking-[0.3em] transition-colors"
          >
            + 新規追加
          </Link>
          <BulkBackfillButton />
        </div>
      </header>

      {restaurants.length === 0 ? (
        <p className="text-center py-20 text-[color:var(--color-text-muted)]">
          まだ店舗がありません。
        </p>
      ) : (
        <>
          {/* PC: テーブル表示 */}
          <div className="hidden md:block overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs tracking-widest text-[color:var(--color-text-faded)] border-b border-[color:var(--color-border-soft)]">
                  <th className="pb-4 px-2 font-normal">店名</th>
                  <th className="pb-4 px-2 font-normal">エリア</th>
                  <th className="pb-4 px-2 font-normal">ジャンル</th>
                  <th className="pb-4 px-2 font-normal">公開</th>
                  <th className="pb-4 px-2 font-normal text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[color:var(--color-border-soft)]"
                  >
                    <td className="py-4 px-2">
                      <p className="font-serif text-base">{r.name}</p>
                      <p className="text-[10px] text-[color:var(--color-text-faded)] mt-1">
                        {r.slug}
                      </p>
                    </td>
                    <td className="py-4 px-2 text-[color:var(--color-text-muted)]">
                      {r.prefecture} {r.area}
                    </td>
                    <td className="py-4 px-2 text-[color:var(--color-text-muted)]">
                      {genreSlugToName(r.genre ?? "")}
                    </td>
                    <td className="py-4 px-2">
                      {r.is_published ? (
                        <span className="text-xs tracking-widest text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40 px-2 py-1">
                          公開
                        </span>
                      ) : (
                        <span className="text-xs tracking-widest text-[color:var(--color-text-faded)] border border-[color:var(--color-border)] px-2 py-1">
                          下書き
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <Link
                        href={`/admin/restaurants/${r.id}/edit`}
                        className="text-xs tracking-widest text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
                      >
                        編集 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル: カード表示 */}
          <ul className="md:hidden space-y-3">
            {restaurants.map((r) => (
              <li key={r.id} className="luxury-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-serif text-base flex-1 min-w-0">{r.name}</p>
                  {r.is_published ? (
                    <span className="text-[10px] tracking-widest text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40 px-2 py-1 whitespace-nowrap">
                      公開
                    </span>
                  ) : (
                    <span className="text-[10px] tracking-widest text-[color:var(--color-text-faded)] border border-[color:var(--color-border)] px-2 py-1 whitespace-nowrap">
                      下書き
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[color:var(--color-text-faded)] mb-3">
                  {r.slug}
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)] mb-3">
                  {r.prefecture} {r.area} / {genreSlugToName(r.genre ?? "")}
                </p>
                <Link
                  href={`/admin/restaurants/${r.id}/edit`}
                  className="text-xs tracking-widest text-[color:var(--color-gold)]"
                >
                  編集 →
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
