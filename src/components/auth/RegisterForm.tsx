import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword || password.length < 6) {
      setIsLoading(false);
      return;
    }

    await signUp(email, password, name, organizationName, telefone);
    setIsLoading(false);
  };

  const inputClass =
    "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-orange-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold text-slate-900">
            Nome completo
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className={inputClass}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone" className="font-semibold text-slate-900">
            WhatsApp
          </Label>
          <Input
            id="telefone"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationName" className="font-semibold text-slate-900">
          Empresa ou organização
        </Label>
        <Input
          id="organizationName"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="Nome da sua empresa"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-slate-900">
          Email profissional
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className={inputClass}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-slate-900">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`${inputClass} pr-12`}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-semibold text-slate-900">
            Confirmar senha
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className={`${inputClass} pr-12`}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-10 px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-slate-400" />
              ) : (
                <Eye className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
        disabled={isLoading}
      >
        {isLoading ? "Criando conta..." : "Criar conta"}
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
