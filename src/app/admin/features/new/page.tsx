import { FeatureForm } from "../feature-form";
import { fetchAllRestaurants } from "@/lib/data";

export const metadata = { title: "新規特集" };

export default async function NewFeaturePage() {
  const restaurants = await fetchAllRestaurants();

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 sm:mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          NEW FEATURE
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl">特集を作成</h1>
      </header>
      <FeatureForm restaurants={restaurants} />
    </div>
  );
}
