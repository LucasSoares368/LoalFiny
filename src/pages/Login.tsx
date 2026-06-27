import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() =>
    searchParams.get("type") === "recovery" ? "reset-password" : "login",
  );

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isPasswordFlow = mode === "forgot-password" || mode === "reset-password";

  const renderAuthForm = () => {
    switch (mode) {
      case "login":
        return (
          <LoginForm
            onSwitchToRegister={() => setMode("register")}
            onSwitchToForgot={() => setMode("forgot-password")}
          />
        );
      case "register":
        return <RegisterForm onSwitchToLogin={() => setMode("login")} />;
      case "forgot-password":
        return <ForgotPasswordForm onSwitchToLogin={() => setMode("login")} />;
      case "reset-password":
        return <ResetPasswordForm onSwitchToLogin={() => setMode("login")} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#041d36] text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,106,0,0.38),transparent_28%),linear-gradient(145deg,#0D1B2A_0%,#10263b_52%,#FF6A00_135%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/25 to-transparent" />

          <div className="relative flex w-full flex-col justify-between px-16 py-14">
            <img
              src="/brand/logo-dark.png"
              alt="LocalFiny"
              className="h-16 w-fit object-contain"
            />

            <div className="max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-orange-100 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Controle financeiro inteligente
              </p>
              <h1 className="text-5xl font-bold leading-tight tracking-normal xl:text-6xl">
                Sua clareza financeira começa aqui.
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-8 text-white/78">
                Organize receitas, despesas, contas e metas em uma plataforma moderna para tomar decisões com mais segurança.
              </p>
            </div>

            <div className="grid gap-4 text-base font-semibold text-white/92">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                Dados protegidos e acesso centralizado
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <BarChart3 className="h-6 w-6" />
                </span>
                Indicadores claros para acompanhar seu progresso
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <WalletCards className="h-6 w-6" />
                </span>
                Carteira, bancos e cartões em um só lugar
              </div>
            </div>

            <p className="text-sm text-white/48">© 2026 LocalFiny. Todos os direitos reservados.</p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-xl">
            <div className="mb-10 flex justify-center lg:hidden">
              <img src="/brand/logo.png" alt="LocalFiny" className="h-16 w-auto object-contain" />
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-bold tracking-normal text-slate-950">
                {isLogin && "Bem-vindo de volta"}
                {isRegister && "Bem-vindo de volta"}
                {mode === "forgot-password" && "Recupere sua senha"}
                {mode === "reset-password" && "Defina sua nova senha"}
              </h2>
              <p className="mt-3 max-w-md text-lg leading-7 text-slate-600">
                {isLogin && "Acesse seu painel e continue organizando sua vida financeira."}
                {isRegister && "Gerencie suas finanças com a plataforma mais moderna para sua rotina."}
                {mode === "forgot-password" && "Informe seu email para receber as instruções de recuperação."}
                {mode === "reset-password" && "Escolha uma nova senha segura para sua conta."}
              </p>
            </div>

            {!isPasswordFlow ? (
              <div className="mb-8 grid rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isLogin ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isRegister ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Criar conta
                </button>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
              {renderAuthForm()}
            </div>

            <div className="mt-8 text-center">
              <Link to="/" className="text-sm font-semibold text-slate-500 transition hover:text-[#FF6A00]">
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
