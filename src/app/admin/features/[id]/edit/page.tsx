import { notFound } from "next/navigation";
import { FeatureForm } from "../../feature-form";
import { fetchAllFeatures, fetchAllRestaurants } from "@/lib/data";

export const metadata = { title: "特集編集" };

export default async function EditFeaturePage(
  props: PageProps<"/admin/features/[id]/edit">,
) {
  const { id } = await props.params;
  const [features, restaurants] = await Promise.all([
    fetchAllFeatures(),
    fetchAllRestaurants(),
  ]);
  const feature = features.find((f) => f.id === id);
  if (!feature) notFound();

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 sm:mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          EDIT FEATURE
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl">{feature.title}</h1>
      </header>
      <FeatureForm initial={feature} restaurants={restaurants} />
    </div>
  );
}
