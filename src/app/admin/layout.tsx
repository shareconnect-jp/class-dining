import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = {
  title: { default: "管理画面", template: "%s | 管理画面 | CLASS DINING" },
};

async function getCurrentUser() {
  // Supabase 未設定でも管理画面は閲覧可能（プレビュー用）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { unconfigured: true as const, user: null };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { unconfigured: false as const, user };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { unconfigured, user } = await getCurrentUser();
  if (!unconfigured && !user) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      {/* モバイル用 上部バー */}
      <div className="lg:hidden border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)] px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-base tracking-[0.3em] text-gold-gradient font-bold">
            CLASS
          </span>
          <span className="font-serif text-base tracking-[0.3em] font-light">
            DINING
          </span>
          <span className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-faded)] ml-2">
            ADMIN
          </span>
        </Link>
        <nav className="mt-4 flex gap-1 overflow-x-auto -mx-5 px-5 pb-1">
          <NavLink href="/admin" mobile>ホーム</NavLink>
          <NavLink href="/admin/restaurants" mobile>店舗</NavLink>
          <NavLink href="/admin/genres" mobile>ジャンル</NavLink>
          <NavLink href="/admin/features" mobile>特集</NavLink>
        </nav>
      </div>

      {/* PC 用サイドバー */}
      <aside className="hidden lg:flex w-64 border-r border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)] p-6 flex-col">
        <Link href="/" className="mb-12 block">
          <span className="font-serif text-lg tracking-[0.3em] text-gold-gradient font-bold">
            CLASS
          </span>
          <span className="font-serif text-lg tracking-[0.3em] ml-2 font-light">
            DINING
          </span>
          <p className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-faded)] mt-1">
            ADMIN
          </p>
        </Link>
        <nav className="space-y-2 text-sm flex-1">
          <NavLink href="/admin">ダッシュボード</NavLink>
          <NavLink href="/admin/restaurants">店舗</NavLink>
          <NavLink href="/admin/genres">ジャンル</NavLink>
          <NavLink href="/admin/features">特集</NavLink>
        </nav>
        <div className="pt-6 border-t border-[color:var(--color-border-soft)] space-y-2">
          {user?.email && (
            <p className="text-[10px] text-[color:var(--color-text-faded)] truncate">
              {user.email}
            </p>
          )}
          {unconfigured ? (
            <p className="text-[10px] text-amber-400/80 leading-relaxed">
              Supabase未設定。<br />.env.local 設定後に認証が有効化されます。
            </p>
          ) : (
            <form action="/admin/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-[10px] tracking-[0.3em] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)]"
              >
                LOG OUT
              </button>
            </form>
          )}
          <Link
            href="/"
            className="block text-[10px] tracking-[0.3em] text-[color:var(--color-text-faded)] hover:text-[color:var(--color-gold)]"
          >
            ← サイトを見る
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
  mobile,
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        className="px-3 py-2 text-xs tracking-wider whitespace-nowrap text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] border border-[color:var(--color-border-soft)] hover:border-[color:var(--color-gold)] transition-colors"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="block px-3 py-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] hover:bg-[color:var(--color-bg-soft)] transition-colors"
    >
      {children}
    </Link>
  );
}
