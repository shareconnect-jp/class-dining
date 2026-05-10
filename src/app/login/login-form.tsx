"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const ADMIN_EMAIL = "tkm.koike@gmail.com";
// Supabase が 6 文字以上を要求するため、4桁 PIN に固定suffix を付与して送信。
// 実効的な秘密性は 4 桁 PIN そのもの。
const PIN_SUFFIX = "pin";

export function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: pin + PIN_SUFFIX,
      });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "PIN が違います"
            : error.message,
        );
        setPin("");
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
        <label className="block text-xs tracking-[0.3em] text-[color:var(--color-gold)] mb-3 text-center">
          PIN (4桁)
        </label>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
          required
          autoFocus
          autoComplete="off"
          className="w-full px-4 py-5 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-3xl tracking-[0.6em] text-center font-mono"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 leading-relaxed text-center">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || pin.length < 4}
        className="w-full py-4 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors text-sm tracking-[0.3em] disabled:opacity-50"
      >
        {loading ? "..." : "入る"}
      </button>
    </form>
  );
}
