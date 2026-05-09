import { LoginForm } from "./login-form";

export const metadata = {
  title: "ログイン",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.5em] text-[color:var(--color-gold)] mb-4">
            ADMIN
          </p>
          <h1 className="font-serif text-3xl">CLASS DINING 管理画面</h1>
        </div>
        <div className="luxury-card p-8">
          <LoginForm />
        </div>
        <p className="text-xs text-[color:var(--color-text-faded)] text-center mt-8 leading-relaxed">
          Supabase Auth による認証です。
          <br />
          初回は Supabase ダッシュボードでユーザー作成してください。
        </p>
      </div>
    </main>
  );
}
