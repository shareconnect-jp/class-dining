export const metadata = { title: "特集管理" };

export default function AdminFeaturesPage() {
  return (
    <div className="p-10">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          FEATURES
        </p>
        <h1 className="font-serif text-3xl">特集管理</h1>
      </header>
      <div className="luxury-card p-8 max-w-2xl">
        <p className="text-sm text-[color:var(--color-text-muted)] leading-loose">
          特集機能はDBスキーマ作成済み（features テーブル）。
          編集UIは Phase 2 で実装します。
          まずは店舗データの登録を進めてください。
        </p>
      </div>
    </div>
  );
}
