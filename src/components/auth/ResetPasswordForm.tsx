import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ResetPasswordForm = ({ onSwitchToLogin }: ResetPasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso. Faça login com sua nova senha.",
      });

      onSwitchToLogin();
      navigate("/login");
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao redefinir senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-base focus-visible:ring-[#FF6A00]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password" className="font-semibold text-slate-900">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
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
          Confirmar nova senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua nova senha"
            className={inputClass}
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

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#e85f00] text-base font-bold shadow-lg shadow-[#FF6A00]/20 hover:from-[#e85f00] hover:to-[#cc5500]"
        disabled={isLoading}
      >
        {isLoading ? "Alterando senha..." : "Alterar senha"}
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
