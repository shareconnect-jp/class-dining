import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-serif text-2xl tracking-[0.3em] text-gold-gradient font-bold">
                CLASS
              </span>
              <span className="font-serif text-2xl tracking-[0.3em] font-light">
                DINING
              </span>
            </div>
            <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed max-w-md">
              経営者・士業のための接待・出張グルメメディア。
              静かなラグジュアリーを纏った名店だけを、厳選してお届けします。
            </p>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-5">
              CONTENTS
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/restaurants"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  店舗一覧
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  特集
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-5">
              AREAS
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/tokyo/sushi"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  東京 / 寿司
                </Link>
              </li>
              <li>
                <Link
                  href="/osaka/yakiniku"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  大阪 / 焼肉
                </Link>
              </li>
              <li>
                <Link
                  href="/aichi/washoku"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  愛知 / 和食
                </Link>
              </li>
              <li>
                <Link
                  href="/fukuoka/bar"
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
                >
                  福岡 / バー
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[color:var(--color-border-soft)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-[color:var(--color-text-faded)] tracking-wider">
            © {new Date().getFullYear()} CLASS DINING. All rights reserved.
          </p>
          <p className="text-xs text-[color:var(--color-text-faded)] tracking-wider">
            運営: 株式会社シェアコネクト
          </p>
        </div>
      </div>
    </footer>
  );
}
