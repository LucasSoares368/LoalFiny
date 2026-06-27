import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm = ({ onSwitchToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (!error) {
      setEmailSent(true);
    }

    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-2 font-semibold text-emerald-900">Email enviado com sucesso</h3>
          <p className="text-sm leading-6 text-emerald-700">
            Enviamos um link para redefinir sua senha para {email}. Verifique sua caixa de entrada e spam.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={onSwitchToLogin} className="h-12 w-full rounded-2xl">
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-slate-900">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-orange-500"
          required
        />
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-semibold text-orange-600 hover:text-orange-500"
        >
          Voltar para o login
        </button>
      </div>
    </form>
  );
};
