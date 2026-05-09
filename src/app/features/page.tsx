import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "特集",
  description: "経営者・士業向けの接待・出張グルメ特集。",
};

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <header className="mb-16 gold-divider text-center">
          <p className="text-xs tracking-[0.5em] text-[color:var(--color-gold)] mb-4">
            FEATURES
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">特集</h1>
        </header>

        <div className="text-center py-20">
          <p className="text-[color:var(--color-text-muted)]">
            特集記事は準備中です。
          </p>
          <p className="text-xs text-[color:var(--color-text-faded)] mt-4">
            管理画面から `/admin/features` で記事を作成できます。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
