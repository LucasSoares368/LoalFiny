import { useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const passwordRules = useMemo(
    () => [
      { label: "Mínimo de 8 caracteres", valid: password.length >= 8 },
      { label: "Pelo menos 1 letra maiúscula", valid: /[A-Z]/.test(password) },
      { label: "Pelo menos 1 letra minúscula", valid: /[a-z]/.test(password) },
      { label: "Pelo menos 1 número", valid: /\d/.test(password) },
      { label: "Pelo menos 1 caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const passwordScore = passwordRules.filter((rule) => rule.valid).length;
  const passwordPercent = Math.round((passwordScore / passwordRules.length) * 100);
  const isPasswordStrong = passwordScore === passwordRules.length;
  const canSubmit = name.trim() && email.trim() && isPasswordStrong && acceptedTerms && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    await signUp(email, password, name.trim(), "", "");
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-semibold text-slate-950">
          Nome completo
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como gostaria de ser chamado?"
          className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-orange-500"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-slate-950">
          Melhor email
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

      <div className="space-y-3">
        <Label htmlFor="password" className="font-semibold text-slate-950">
          Crie sua senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite uma senha segura"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-base focus-visible:ring-orange-500"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-10 px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-slate-400" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">
              Força da senha: {isPasswordStrong ? "Forte" : passwordScore >= 3 ? "Média" : "Fraca"}
            </span>
            <span className={isPasswordStrong ? "text-emerald-600" : "text-orange-600"}>{passwordPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                isPasswordStrong ? "bg-emerald-500" : passwordScore >= 3 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${passwordPercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2 text-xs font-medium text-slate-600 sm:grid-cols-2">
          {passwordRules.map((rule) => (
            <div key={rule.label} className={rule.valid ? "flex items-center gap-2 text-emerald-600" : "flex items-center gap-2"}>
              <Check className="h-3.5 w-3.5" />
              {rule.label}
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 accent-orange-600"
        />
        <span>
          Ao criar uma conta, você concorda com nossos{" "}
          <a href="#" className="font-semibold text-orange-600 hover:text-orange-500">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="font-semibold text-orange-600 hover:text-orange-500">
            Política de Privacidade
          </a>
          .
        </span>
      </label>

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
        disabled={!canSubmit}
      >
        {isLoading ? "Criando conta..." : "Começar agora"}
      </Button>

      <div className="text-center">
        <span className="text-sm text-slate-500">
          Já tem uma conta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-orange-600 hover:text-orange-500"
          >
            Faça login
          </button>
        </span>
      </div>
    </form>
  );
};
