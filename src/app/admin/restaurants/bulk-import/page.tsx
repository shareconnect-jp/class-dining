import { BulkImportClient } from "./bulk-import-client";

export default function BulkImportPage() {
  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-5xl">
      <header className="mb-8 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          BULK IMPORT
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl mb-3">店舗を一括登録</h1>
        <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
          1 行に「店名 + 食べログ URL」を貼り付けて「一括登録を実行」を押すと、
          各 URL を順にスクレイプしてギャラリー写真を含む全情報を取り込みます。
          重複 (同じ tabelog_url で既登録) はスキップ。都道府県が取れなかった
          店舗もスキップしてサマリに表示します。下書きとして保存されるので、
          各店舗を開いて内容を確認してから公開してください。
        </p>
      </header>
      <BulkImportClient />
    </div>
  );
}
