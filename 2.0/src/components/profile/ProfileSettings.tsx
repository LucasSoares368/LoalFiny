import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, ShieldCheck } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { motion } from "framer-motion";

const ProfileSettings = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || "");
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (profile) {
          setFullName(profile.full_name || "");
        }
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // If email changed, update auth email
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast.info("Um email de confirmação foi enviado para o novo endereço.");
      }

      toast.success("Perfil atualizado com sucesso!");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!isPasswordValid) {
      toast.error("A nova senha não atende aos requisitos de segurança");
      return;
    }

    setUpdating(true);
    try {
      // 1. Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 px-1 animate-in fade-in duration-500">
      <div className="grid gap-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <User size={18} />
            <h3 className="font-semibold text-lg">Informações Básicas</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 h-11"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                Nota: Alterar o email exigirá nova confirmação.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 font-semibold" 
              disabled={updating}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
            </Button>
          </form>
        </div>

        <div className="border-t border-border pt-8" />

        {/* Security / Password */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Lock size={18} />
            <h3 className="font-semibold text-lg">Segurança</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                required
              />
            </div>
            
            <PasswordInput
              id="newPassword"
              label="Nova Senha"
              value={newPassword}
              onChange={setNewPassword}
              onValidityChange={setIsPasswordValid}
            />

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="outline"
              className="w-full h-11 font-semibold border-primary text-primary hover:bg-primary/5" 
              disabled={updating}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar Senha"}
            </Button>
          </form>
        </div>
      </div>

      {/* Account Info Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground p-4 bg-muted/20 rounded-xl border border-dashed text-center">
        <ShieldCheck size={14} className="shrink-0" />
        <span>Sua conta está protegida com criptografia de ponta a ponta.</span>
      </div>
    </div>
  );
};

export default ProfileSettings;