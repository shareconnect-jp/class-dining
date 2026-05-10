import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScoreBar } from "@/components/score-bar";
import { fetchRestaurantBySlug } from "@/lib/data";
import { genreSlugToName, prefectureNameToSlug } from "@/lib/types";
import { buildTabelogVisitUrl } from "@/lib/tabelog";

export async function generateMetadata(props: PageProps<"/restaurants/[slug]">) {
  const { slug } = await props.params;
  const r = await fetchRestaurantBySlug(slug);
  if (!r) return { title: "店舗が見つかりません" };
  return {
    title: r.name,
    description: r.description ?? undefined,
    openGraph: {
      title: r.name,
      description: r.description ?? undefined,
      images: r.main_image_url ? [r.main_image_url] : [],
    },
  };
}

export default async function RestaurantDetailPage(
  props: PageProps<"/restaurants/[slug]">,
) {
  const { slug } = await props.params;
  const r = await fetchRestaurantBySlug(slug);
  if (!r) notFound();

  const priceLabel =
    r.price_min && r.price_max
      ? `¥${r.price_min.toLocaleString()} 〜 ¥${r.price_max.toLocaleString()}`
      : null;

  const prefSlug = prefectureNameToSlug(r.prefecture ?? "");
  const tabelogUrl = buildTabelogVisitUrl(r);
  const galleryImages = (r.gallery_image_urls ?? []).filter(
    (u) => u && u !== r.main_image_url,
  );

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO IMAGE — モバイルは縦長め、PCはワイド */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] bg-[color:var(--color-bg-soft)] overflow-hidden">
          {r.main_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.main_image_url}
              alt={r.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pb-6 sm:pb-10 md:pb-12">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] tracking-[0.4em] text-[color:var(--color-gold)] mb-3 sm:mb-4">
              <span>{r.prefecture}</span>
              <span className="opacity-40">/</span>
              <span>{r.area}</span>
              <span className="opacity-40">/</span>
              <span>{genreSlugToName(r.genre ?? "")}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl leading-tight">
              {r.name}
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-12 sm:py-16 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* 本文 */}
          <div className="lg:col-span-2 space-y-10 sm:space-y-12 order-2 lg:order-1">
            <section>
              <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-4">
                ABOUT
              </p>
              <p className="text-sm sm:text-base leading-loose text-[color:var(--color-text)]">
                {r.description}
              </p>
            </section>

            <section>
              <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                SCORE
              </p>
              <div className="space-y-3">
                <ScoreBar label="接待" value={r.business_dining_score} />
                <ScoreBar label="静かさ" value={r.quietness_score} />
                <ScoreBar label="会話" value={r.conversation_score} />
                <ScoreBar label="アクセス" value={r.access_score} />
              </div>
            </section>

            <section>
              <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                FEATURES
              </p>
              <div className="flex flex-wrap gap-2">
                {r.private_room && <Tag label="個室" />}
                {r.vip_available && <Tag label="VIP対応" />}
                {r.business_trip_friendly && <Tag label="出張向き" />}
                {r.customer_types?.map((c) => (
                  <Tag key={c} label={c} variant="muted" />
                ))}
              </div>
            </section>

            {/* DETAIL — Tabelog 拡張取得情報 */}
            {(r.phone || r.opening_hours || r.closed_days || r.seats || r.access_text) && (
              <section>
                <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                  DETAIL
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  {r.phone && (
                    <DetailRow label="電話">
                      <a
                        href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
                        className="text-[color:var(--color-gold)] hover:underline"
                      >
                        {r.phone}
                      </a>
                    </DetailRow>
                  )}
                  {r.opening_hours && (
                    <DetailRow label="営業時間">
                      <span className="whitespace-pre-line">{r.opening_hours}</span>
                    </DetailRow>
                  )}
                  {r.closed_days && (
                    <DetailRow label="定休日">{r.closed_days}</DetailRow>
                  )}
                  {r.seats && <DetailRow label="席数">{r.seats}</DetailRow>}
                  {r.access_text && (
                    <DetailRow label="アクセス">
                      <span className="whitespace-pre-line">{r.access_text}</span>
                    </DetailRow>
                  )}
                  {r.cards_accepted && (
                    <DetailRow label="クレカ">{r.cards_accepted}</DetailRow>
                  )}
                  {r.smoking && <DetailRow label="喫煙">{r.smoking}</DetailRow>}
                  {r.parking && <DetailRow label="駐車場">{r.parking}</DetailRow>}
                  {(r.dinner_budget || r.lunch_budget) && (
                    <DetailRow label="予算 (詳細)">
                      {r.dinner_budget && <div>夜 {r.dinner_budget}</div>}
                      {r.lunch_budget && <div>昼 {r.lunch_budget}</div>}
                    </DetailRow>
                  )}
                  {r.rating && (
                    <DetailRow label="食べログ評価">
                      <span className="text-[color:var(--color-gold)] font-bold">★ {r.rating}</span>
                      {r.rating_count ? ` (${r.rating_count}件)` : ""}
                    </DetailRow>
                  )}
                </dl>
              </section>
            )}

            {/* GALLERY */}
            {galleryImages.length > 0 && (
              <section>
                <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                  GALLERY
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {galleryImages.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square overflow-hidden bg-[color:var(--color-bg-soft)] rounded-lg border border-[color:var(--color-border-soft)] hover:border-[color:var(--color-gold)]/40 transition-colors block group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* サイドバー */}
          <aside className="space-y-6 order-1 lg:order-2">
            {/* CTA — 食べログ詳細へ */}
            {tabelogUrl && (
              <a
                href={tabelogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-6 py-5 bg-[color:var(--color-gold)] text-[color:var(--color-bg)] hover:bg-[color:var(--color-gold-soft)] transition-colors font-serif text-base sm:text-lg tracking-[0.2em] shadow-[0_8px_30px_rgba(200,169,107,0.15)]"
              >
                店舗情報を見る →
              </a>
            )}

            <div className="luxury-card p-5 sm:p-6">
              <h3 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                INFORMATION
              </h3>
              <dl className="space-y-4 text-sm">
                {r.address && (
                  <div>
                    <dt className="text-[color:var(--color-text-faded)] text-xs mb-1">
                      所在地
                    </dt>
                    <dd className="break-all">{r.address}</dd>
                  </div>
                )}
                {priceLabel && (
                  <div>
                    <dt className="text-[color:var(--color-text-faded)] text-xs mb-1">
                      予算
                    </dt>
                    <dd>{priceLabel}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[color:var(--color-text-faded)] text-xs mb-1">
                    エリア / ジャンル
                  </dt>
                  <dd>
                    {r.prefecture} {r.area} / {genreSlugToName(r.genre ?? "")}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2 pt-6 border-t border-[color:var(--color-border-soft)]">
                {tabelogUrl && (
                  <ExternalLink href={tabelogUrl} label="Web で店舗情報を探す" />
                )}
                {r.official_url && (
                  <ExternalLink href={r.official_url} label="公式サイト" />
                )}
                {r.instagram_url && (
                  <ExternalLink href={r.instagram_url} label="Instagram" />
                )}
                {r.google_map_url && (
                  <ExternalLink href={r.google_map_url} label="Google Maps" />
                )}
              </div>
            </div>

            <div className="px-2">
              <Link
                href={
                  prefSlug && r.genre ? `/${prefSlug}/${r.genre}` : "/restaurants"
                }
                className="text-xs tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
              >
                ← 同じエリア・ジャンルを見る
              </Link>
            </div>
          </aside>
        </div>

        {/* モバイル用フローティング CTA */}
        {tabelogUrl && (
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-4 bg-[color:var(--color-bg)]/95 backdrop-blur border-t border-[color:var(--color-border-soft)]">
            <a
              href={tabelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-4 bg-[color:var(--color-gold)] text-[color:var(--color-bg)] font-serif text-sm tracking-[0.2em]"
            >
              店舗情報を見る →
            </a>
          </div>
        )}
        {tabelogUrl && <div className="lg:hidden h-20" aria-hidden />}
      </main>
      <SiteFooter />
    </>
  );
}

function Tag({
  label,
  variant = "gold",
}: {
  label: string;
  variant?: "gold" | "muted";
}) {
  const cls =
    variant === "gold"
      ? "border-[color:var(--color-gold)] text-[color:var(--color-gold)]"
      : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]";
  return (
    <span className={`px-3 py-1.5 text-xs tracking-widest border ${cls}`}>
      {label}
    </span>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-xs tracking-[0.2em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors py-1"
    >
      → {label}
    </a>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.3em] text-[color:var(--color-text-faded)] mb-1.5 uppercase">
        {label}
      </dt>
      <dd className="text-sm text-[color:var(--color-text)]">{children}</dd>
    </div>
  );
}
