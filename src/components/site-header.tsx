import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-bg)]/80 border-b border-[color:var(--color-border-soft)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-[0.3em] text-gold-gradient font-bold">
            CLASS
          </span>
          <span className="font-serif text-xl tracking-[0.3em] text-[color:var(--color-text)] font-light">
            DINING
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-widest">
          <Link
            href="/restaurants"
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            店舗
          </Link>
          <Link
            href="/features"
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            特集
          </Link>
          <Link
            href="/tokyo/sushi"
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            東京 寿司
          </Link>
          <Link
            href="/admin"
            className="text-[color:var(--color-text-faded)] hover:text-[color:var(--color-gold)] transition-colors text-xs"
          >
            管理
          </Link>
        </nav>
      </div>
    </header>
  );
}
