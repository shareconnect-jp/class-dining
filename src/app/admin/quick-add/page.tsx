import { QuickAddForm } from "./quick-form";

export const metadata = { title: "取材投稿" };

export default function QuickAddPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto">
      <header className="mb-6 sm:mb-8 pb-5 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          QUICK ADD
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl">取材投稿</h1>
        <p className="text-xs text-[color:var(--color-text-muted)] mt-3 leading-relaxed">
          食べログURLと写真をアップ → AI が紹介文と評価を提案 → 確認して保存。
          <br />
          1分で1店追加できる、モバイル想定の最短入口。
        </p>
      </header>
      <QuickAddForm />
    </div>
  );
}
