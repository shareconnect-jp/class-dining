import { QuickAddForm } from "./quick-form";

export const metadata = { title: "取材投稿" };

export default function QuickAddPage() {
  return (
    <div className="bg-[color:var(--color-bg)] min-h-screen">
      <QuickAddForm />
    </div>
  );
}
