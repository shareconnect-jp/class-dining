"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// 管理者は単一アカウント運用のため、メールはハードコード。
// 複数管理者にする時は env 化 or DB lookup へ移行。
const ADMIN_EMAIL = "tkm.koike@gmail.com";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "パスワードが違います"
            : error.message,
        );
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Supabase 環境変数が設定されていません",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-3">
          PASSWORD
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-4 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-base tracking-widest text-center"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 leading-relaxed text-center">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-4 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-sm tracking-[0.3em] disabled:opacity-50"
      >
        {loading ? "..." : "ログイン"}
      </button>
    </form>
  );
}
