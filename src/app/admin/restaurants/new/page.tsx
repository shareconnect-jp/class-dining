import { RestaurantForm } from "../restaurant-form";

export const metadata = { title: "新規店舗" };

export default function NewRestaurantPage() {
  return (
    <div className="p-10">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border-soft)]">
        <p className="text-xs tracking-[0.4em] text-[color:var(--color-gold)] mb-2">
          NEW RESTAURANT
        </p>
        <h1 className="font-serif text-3xl">店舗を追加</h1>
      </header>
      <RestaurantForm />
    </div>
  );
}
