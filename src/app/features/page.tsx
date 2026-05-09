import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { fetchPublishedFeatures } from "@/lib/data";

export const metadata = {
  title: "特集",
  description:
    "経営者・士業向けの接待・出張グルメ特集。エリア別・ジャンル別の名店ガイド、シーン別おすすめ、エディトリアルピックなど。",
};

export default async function FeaturesPage() {
  const features = await fetchPublishedFeatures();

  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-16 sm:py-20">
        <header className="mb-14 sm:mb-16 gold-divider text-center">
          <p className="text-xs tracking-[0.5em] text-[color:var(--color-gold)] mb-4">
            FEATURES
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl">特集</h1>
          <p className="text-sm text-[color:var(--color-text-muted)] max-w-xl mx-auto mt-6 leading-relaxed">
            CLASS DINING 編集部による、エディトリアルピック・シーンガイド・取材レポート。
          </p>
        </header>

        {features.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[color:var(--color-text-muted)]">
              特集記事は準備中です。
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <li key={f.id}>
                <Link
                  href={`/features/${f.slug}`}
                  className="luxury-card block overflow-hidden group h-full"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[color:var(--color-bg-soft)]">
                    {f.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.hero_image_url}
                        alt={f.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[color:var(--color-text-faded)] text-xs">
                        no image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 text-[10px] tracking-[0.4em] text-[color:var(--color-gold)] font-bold">
                      ISSUE {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <h2 className="font-serif text-xl sm:text-2xl leading-snug group-hover:text-[color:var(--color-gold)] transition-colors mb-3">
                      {f.title}
                    </h2>
                    {f.subtitle && (
                      <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed line-clamp-2">
                        {f.subtitle}
                      </p>
                    )}
                    <p className="mt-5 text-[10px] tracking-[0.3em] text-[color:var(--color-gold)]">
                      READ →
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
