import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScoreBar } from "@/components/score-bar";
import { fetchRestaurantBySlug } from "@/lib/data";
import { genreSlugToName, prefectureNameToSlug } from "@/lib/types";

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

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO IMAGE */}
        <div className="relative w-full aspect-[16/7] bg-[color:var(--color-bg-soft)] overflow-hidden">
          {r.main_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.main_image_url}
              alt={r.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-6 lg:px-10 pb-12">
            <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] text-[color:var(--color-gold)] mb-4">
              <span>{r.prefecture}</span>
              <span className="opacity-40">/</span>
              <span>{r.area}</span>
              <span className="opacity-40">/</span>
              <span>{genreSlugToName(r.genre ?? "")}</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl">{r.name}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* 本文 */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-4">
                ABOUT
              </p>
              <p className="text-base leading-loose text-[color:var(--color-text)]">
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
          </div>

          {/* サイドバー */}
          <aside className="space-y-8">
            <div className="luxury-card p-6">
              <h3 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-6">
                INFORMATION
              </h3>
              <dl className="space-y-4 text-sm">
                {r.address && (
                  <div>
                    <dt className="text-[color:var(--color-text-faded)] text-xs mb-1">
                      所在地
                    </dt>
                    <dd>{r.address}</dd>
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
                    {r.prefecture} {r.area} /{" "}
                    {genreSlugToName(r.genre ?? "")}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2 pt-6 border-t border-[color:var(--color-border-soft)]">
                {r.tabelog_url && (
                  <ExternalLink href={r.tabelog_url} label="食べログで見る" />
                )}
                {r.official_url && (
                  <ExternalLink href={r.official_url} label="公式サイト" />
                )}
                {r.google_map_url && (
                  <ExternalLink href={r.google_map_url} label="Google Maps" />
                )}
              </div>
            </div>

            <div className="px-6">
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
