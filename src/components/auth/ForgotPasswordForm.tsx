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
        <div className="rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/10 p-5">
          <h3 className="mb-2 font-semibold text-[#0D1B2A]">Email enviado com sucesso</h3>
          <p className="text-sm leading-6 text-[#0D1B2A]">
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
          className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-[#FF6A00]"
          required
        />
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#e85f00] text-base font-bold shadow-lg shadow-[#FF6A00]/20 hover:from-[#e85f00] hover:to-[#cc5500]"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-semibold text-[#FF6A00] hover:text-[#FF6A00]"
        >
          Voltar para o login
        </button>
      </div>
    </form>
  );
};
