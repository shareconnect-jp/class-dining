import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function FeatureDetailPage(
  props: PageProps<"/features/[slug]">,
) {
  const { slug } = await props.params;
  // TODO: Supabase features テーブルから取得
  // 現状は常に notFound
  if (slug) notFound();

  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
        <p>特集詳細</p>
      </main>
      <SiteFooter />
    </>
  );
}
