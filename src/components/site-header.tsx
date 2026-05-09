"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/restaurants", label: "店舗" },
  { href: "/features", label: "特集" },
  { href: "/tokyo/sushi", label: "東京 寿司" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // ページ遷移時にメニュー閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // メニュー開いてる間 body スクロール固定
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-bg)]/80 border-b border-[color:var(--color-border-soft)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-lg sm:text-xl tracking-[0.3em] text-gold-gradient font-bold">
            CLASS
          </span>
          <span className="font-serif text-lg sm:text-xl tracking-[0.3em] text-[color:var(--color-text)] font-light">
            DINING
          </span>
        </Link>

        {/* デスクトップ */}
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-widest">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="text-[color:var(--color-text-faded)] hover:text-[color:var(--color-gold)] transition-colors text-xs"
          >
            管理
          </Link>
        </nav>

        {/* モバイル ハンバーガー */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2 text-[color:var(--color-gold)]"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* モバイル ドロワー (フルスクリーン) */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-[color:var(--color-bg)] z-30 overflow-y-auto">
          <nav className="flex flex-col px-6 py-12 gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-5 text-2xl font-serif text-[color:var(--color-text)] hover:text-[color:var(--color-gold)] transition-colors border-b border-[color:var(--color-border-soft)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="block py-5 mt-6 text-sm tracking-[0.3em] text-[color:var(--color-text-faded)] hover:text-[color:var(--color-gold)]"
            >
              ADMIN
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
