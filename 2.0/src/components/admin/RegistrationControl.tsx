import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SettingsLog {
  id: string;
  setting_key: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
}

export const RegistrationControl = () => {
  const [allow, setAllow] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<SettingsLog[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("app_settings")
        .select("allow_registration")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) setAllow(!!data.allow_registration);

      const { data: logData } = await (supabase as any)
        .from("app_settings_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (logData) setLogs(logData as SettingsLog[]);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    const previous = allow;
    setAllow(value);
    try {
      const { error } = await (supabase as any).rpc("update_app_setting", {
        p_allow_registration: value,
      });
      if (error) throw error;
      toast.success(
        value
          ? "Cadastro de novos usuários habilitado"
          : "Cadastro de novos usuários desabilitado"
      );
      load();
    } catch (e: any) {
      setAllow(previous);
      toast.error(e.message || "Erro ao atualizar configuração");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle>Cadastro de Novos Usuários</CardTitle>
        </div>
        <CardDescription>
          Controle se novas contas podem ser criadas no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="font-medium">Permitir novos cadastros</p>
                <p className="text-sm text-muted-foreground">
                  Quando desativado, ninguém conseguirá criar uma nova conta.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={allow ? "default" : "destructive"}>
                  {allow ? "Habilitado" : "Desabilitado"}
                </Badge>
                <Switch
                  checked={allow}
                  onCheckedChange={handleToggle}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Histórico de alterações</p>
              </div>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma alteração registrada ainda.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-sm rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.setting_key}</span>
                        <span className="text-muted-foreground">
                          {log.old_value} → {log.new_value}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationControl;
