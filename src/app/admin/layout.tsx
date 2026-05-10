import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AdminShell } from "@/components/admin-shell";

export const metadata = {
  title: { default: "管理画面", template: "%s | 管理画面 | CLASS DINING" },
};

async function getCurrentUser() {
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
    <AdminShell email={user?.email ?? null} unconfigured={unconfigured}>
      {children}
    </AdminShell>
  );
}
