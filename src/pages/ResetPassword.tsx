import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
// Logo import removed as we now use text branding
import PasswordInput from "@/components/auth/PasswordInput";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    // We need to ensure there's a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Sessão expirada ou inválida. Por favor, solicite a recuperação novamente.");
        navigate("/auth");
      } else {
        setSessionActive(true);
      }
    });
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Por favor, informe a nova senha");
      return;
    }

    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos de segurança.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Senha atualizada com sucesso!");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionActive) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-6">LocalFiny</h1>
          <div className="bg-primary/10 p-3 rounded-2xl mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent text-center">LocalFiny</h1>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mt-2">Definir Nova Senha</h2>
          <p className="text-muted-foreground mt-2 text-center max-w-[300px]">
            Crie uma senha forte e segura para proteger sua conta.
          </p>
        </div>

        <div className="bg-card border border-border/60 shadow-xl rounded-2xl p-8">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <PasswordInput 
              value={password}
              onChange={setPassword}
              onValidityChange={setIsPasswordValid}
              id="reset-password"
              label="Nova Senha"
            />

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Atualizar Senha
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;