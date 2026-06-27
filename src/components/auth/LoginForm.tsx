import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm = ({ onSwitchToRegister, onSwitchToForgot }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (!error) {
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-orange-500"
          required
        />
      </div>

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
            placeholder="Sua senha"
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
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-orange-600" />
          Lembrar de mim
        </label>
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-sm font-semibold text-orange-600 hover:text-orange-500"
        >
          Esqueci a senha
        </button>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Acessar painel"}
      </Button>

      <div className="text-center">
        <span className="text-sm text-slate-500">
          Não tem uma conta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-orange-600 hover:text-orange-500"
          >
            Cadastre-se
          </button>
        </span>
      </div>
    </form>
  );
};
