import { notFound } from "next/navigation";
import { RestaurantForm } from "../../restaurant-form";
import { fetchAllRestaurants } from "@/lib/data";

export const metadata = { title: "店舗編集" };

export default async function EditRestaurantPage(
  props: PageProps<"/admin/restaurants/[id]/edit">,
) {
  const { id } = await props.params;
  const all = await fetchAllRestaurants();
  const restaurant = all.find((r) => r.id === id);
  if (!restaurant) notFound();

  return (
    <div className="p-10">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          EDIT RESTAURANT
        </p>
        <h1 className="font-serif text-3xl">{restaurant.name}</h1>
      </header>
      <RestaurantForm initial={restaurant} />
    </div>
  );
}
