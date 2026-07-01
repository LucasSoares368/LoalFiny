import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  MessageCircle,
  Plus,
  Send,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppPhoneDialog } from "@/components/whatsapp/WhatsAppPhoneDialog";
import { ReminderFormDialog } from "@/components/whatsapp/ReminderFormDialog";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { LimitWarning } from "@/components/plans/LimitWarning";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  reminder_type: string;
  reference_id: string | null;
  day_of_month: number | null;
  day_of_week: number | null;
  time_of_day: string;
  days_before: number;
  is_active: boolean;
  last_sent_at: string | null;
}

interface UserProfile {
  phone_number: string | null;
  whatsapp_notifications_enabled: boolean | null;
}

interface MessageLog {
  id: string;
  created_at: string;
  message_type: string;
  status: string | null;
  error_message: string | null;
  message_content: string;
  sent_at: string | null;
}

const REMINDER_TYPE_LABELS: Record<string, string> = {
  daily_summary: "Resumo diário",
  weekly_summary: "Resumo semanal",
  monthly_summary: "Resumo mensal",
  bill: "Conta a pagar",
  custom: "Personalizado",
  smart_alerts: "Alertas inteligentes",
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const cardClass = "rounded-2xl border-border/80 bg-card shadow-sm";

export default function WhatsApp() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const { plan, usage, loading: planLoading, canUseWhatsApp, canAddReminder, refetch: refetchPlan } = useUserPlan();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
      refetchPlan();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileResult, remindersResult, logsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("phone_number, whatsapp_notifications_enabled")
          .eq("id", user.id)
          .single(),
        supabase
          .from("reminders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("whatsapp_messages_log")
          .select("id, created_at, message_type, status, error_message, message_content, sent_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (remindersResult.data) setReminders(remindersResult.data);
      if (logsResult.data) setMessageLogs(logsResult.data as MessageLog[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const isConnected = Boolean(profile?.phone_number && profile?.whatsapp_notifications_enabled);

  const handleToggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ is_active: isActive })
        .eq("id", reminderId);

      if (error) throw error;

      setReminders(reminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, is_active: isActive } : reminder,
      ));

      toast.success(isActive ? "Lembrete ativado" : "Lembrete desativado");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return;

    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderToDelete);

      if (error) throw error;

      setReminders(reminders.filter((reminder) => reminder.id !== reminderToDelete));
      toast.success("Lembrete excluído");
      refetchPlan();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setReminderToDelete(null);
    }
  };

  const handleSendTestMessage = async () => {
    if (!isConnected) {
      toast.error("Configure seu WhatsApp primeiro");
      return;
    }

    try {
      setSendingTest(true);

      const response = await supabase.functions.invoke("send-whatsapp", {
        body: {
          message: "*Teste LocalFiny*\n\nSua integração com WhatsApp está funcionando corretamente.\n\n_Este é um teste automático._",
          messageType: "test",
        },
      });

      if (response.error) throw response.error;

      toast.success("Mensagem de teste enviada");
      loadData(true);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setSendingTest(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const localNumber = digits.startsWith("55") ? digits.slice(2) : digits;

    if (localNumber.length === 11) {
      return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2, 7)}-${localNumber.slice(7)}`;
    }

    if (localNumber.length === 10) {
      return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2, 6)}-${localNumber.slice(6)}`;
    }

    return phone;
  };

  const formatSchedule = (reminder: Reminder) => {
    const time = reminder.time_of_day?.slice(0, 5) || "09:00";

    if (reminder.reminder_type === "daily_summary") {
      return `Todos os dias às ${time}`;
    }

    if (reminder.reminder_type === "weekly_summary" && reminder.day_of_week !== null) {
      return `Toda ${DAYS_OF_WEEK[reminder.day_of_week]} às ${time}`;
    }

    if (reminder.reminder_type === "monthly_summary" && reminder.day_of_month) {
      return `Dia ${reminder.day_of_month} de cada mês às ${time}`;
    }

    if (reminder.reminder_type === "bill" && reminder.day_of_month) {
      const daysBeforeText = reminder.days_before > 0 ? ` (${reminder.days_before} dias antes)` : "";
      return `Dia ${reminder.day_of_month}${daysBeforeText} às ${time}`;
    }

    if (reminder.day_of_week !== null) {
      return `Toda ${DAYS_OF_WEEK[reminder.day_of_week]} às ${time}`;
    }

    if (reminder.day_of_month) {
      return `Dia ${reminder.day_of_month} de cada mês às ${time}`;
    }

    return `Todos os dias às ${time}`;
  };

  const handleOpenNewReminder = () => {
    if (!canAddReminder()) {
      toast.error(`Limite de ${plan.max_reminders} lembretes atingido. Faça upgrade para adicionar mais.`);
      navigate("/upgrade");
      return;
    }

    setSelectedReminder(null);
    setReminderDialogOpen(true);
  };

  const Header = () => (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            WhatsApp
          </h1>
          <p className="mt-1 max-w-2xl text-lg text-muted-foreground">
            Receba lembretes, alertas e resumos financeiros direto no seu WhatsApp.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 rounded-2xl px-5 font-semibold"
          onClick={() => setPhoneDialogOpen(true)}
        >
          <Smartphone className="mr-2 h-4 w-4" />
          {isConnected ? "Alterar número" : "Configurar"}
        </Button>
        <Button className="h-12 rounded-2xl px-5 font-bold" onClick={handleOpenNewReminder}>
          <Plus className="mr-2 h-4 w-4" />
          Novo lembrete
        </Button>
      </div>
    </div>
  );

  if (!planLoading && !canUseWhatsApp()) {
    return (
      <AppLayout title="WhatsApp">
        <div className="mx-auto max-w-3xl space-y-8">
          <Header />

          <UpgradePrompt
            feature="Assistente Virtual WhatsApp"
            description="Receba resumos financeiros diários, semanais e mensais diretamente no seu WhatsApp. Configure lembretes para contas a pagar e nunca mais esqueça um vencimento."
            requiredPlan="pro"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="WhatsApp">
      <div className="mx-auto max-w-7xl space-y-8">
        <Header />

        {plan.plan_type === "pro" && (
          <LimitWarning
            resource="lembretes"
            current={usage.reminders_count}
            max={plan.max_reminders}
            alwaysShow
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-xl">Status da conexão</CardTitle>
              <CardDescription>Confira se o WhatsApp está pronto para receber mensagens.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {isConnected ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <XCircle className="h-7 w-7" />
                    </div>
                  )}

                  <div>
                    <p className="text-lg font-bold">{isConnected ? "Conectado" : "Não conectado"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected
                        ? formatPhoneDisplay(profile?.phone_number || "")
                        : "Configure seu número para receber mensagens"}
                    </p>
                  </div>
                </div>

                {isConnected && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={handleSendTestMessage}
                    disabled={sendingTest || isRefreshing}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendingTest ? "Enviando..." : "Testar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="mb-2 text-lg font-bold">Como funciona?</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Informe seu número de WhatsApp para receber mensagens.</p>
                    <p>Crie lembretes para contas a pagar e resumos financeiros.</p>
                    <p>As mensagens chegam automaticamente no horário configurado.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={cardClass}>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bell className="h-5 w-5 text-primary" />
                  Lembretes configurados
                </CardTitle>
                <CardDescription>Seus lembretes automáticos por WhatsApp.</CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                {reminders.length} {reminders.length === 1 ? "lembrete" : "lembretes"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando lembretes...</div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
                <Bell className="mb-4 h-14 w-14 text-muted-foreground/50" />
                <p className="text-lg font-bold text-foreground">Nenhum lembrete configurado</p>
                <p className="mt-1 text-muted-foreground">Crie seu primeiro lembrete para receber alertas.</p>
                <Button className="mt-5 h-12 rounded-2xl px-6 font-bold" onClick={handleOpenNewReminder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar lembrete
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`rounded-2xl border bg-background p-5 shadow-sm transition-opacity ${
                      !reminder.is_active ? "opacity-55" : ""
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-lg font-bold leading-tight">{reminder.title}</h4>
                        <Badge variant="secondary" className="mt-2 rounded-full text-xs">
                          {REMINDER_TYPE_LABELS[reminder.reminder_type] || reminder.reminder_type}
                        </Badge>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={(checked) => handleToggleReminder(reminder.id, checked)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full"
                          onClick={() => {
                            setSelectedReminder(reminder);
                            setReminderDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-destructive hover:text-destructive"
                          onClick={() => {
                            setReminderToDelete(reminder.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{formatSchedule(reminder)}</span>
                      </span>
                      {reminder.last_sent_at && (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">
                            Último: {new Date(reminder.last_sent_at).toLocaleDateString("pt-BR")}{" "}
                            {new Date(reminder.last_sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-xl">Histórico de envios</CardTitle>
            <CardDescription>Últimas mensagens enviadas para seu WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            {messageLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Nenhum envio registrado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {messageLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {log.message_type}
                        </Badge>
                        <Badge variant={log.status === "sent" ? "default" : "outline"} className="rounded-full text-xs">
                          {log.status || "unknown"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                      {log.message_content}
                    </div>
                    {log.error_message && (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                        Erro: {log.error_message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WhatsAppPhoneDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        onSuccess={() => loadData(true)}
        currentPhone={profile?.phone_number?.replace(/^55/, "") || ""}
        notificationsEnabled={profile?.whatsapp_notifications_enabled ?? true}
      />

      <ReminderFormDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        reminder={selectedReminder}
        onSuccess={() => loadData(true)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lembrete será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReminder}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
