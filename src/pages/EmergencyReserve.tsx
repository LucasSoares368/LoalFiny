import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Lightbulb,
  Loader2,
  Minus,
  PiggyBank,
  Receipt,
  Save,
  Shield,
  Target,
  TrendingUp,
  User,
  Wallet,
  X,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { FixedCostsManager } from "@/components/emergency/FixedCostsManager";
import { VariableCostAnalytics } from "@/components/emergency/VariableCostAnalytics";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";

interface EmergencyGoal {
  id: string;
  target_months: number;
  target_amount: number | null;
  current_amount: number;
  goal_type: "months" | "amount" | "both";
}

interface FixedCost {
  id: string;
  name: string;
  amount: number;
  is_variable: boolean;
  category_id: string | null;
}

const emergencyGoalSchema = z.object({
  goal_type: z.enum(["months", "amount", "both"]),
  target_months: z.number().min(1, "Mínimo de 1 mês").max(24, "Máximo de 24 meses"),
  target_amount: z.number().positive("Valor deve ser positivo").max(999999999.99, "Valor muito alto").optional(),
});

const defaultGoal: EmergencyGoal = {
  id: "",
  target_months: 6,
  target_amount: null,
  current_amount: 0,
  goal_type: "months",
};

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ReserveKpi({
  title,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Shield;
  tone?: "primary" | "success" | "warning";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardContent className="flex min-h-[132px] flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const EmergencyReserve = () => {
  const navigate = useNavigate();
  const { canUseBusinessProfile } = useUserPlan();
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const [loading, setLoading] = useState(true);
  const [costsLoading, setCostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);
  const [emergencyGoal, setEmergencyGoal] = useState<EmergencyGoal | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: "months" as "months" | "amount" | "both",
    target_months: 6,
    target_amount: "",
  });

  const activeGoal = emergencyGoal ?? defaultGoal;
  const isPersonal = currentProfile === "personal";

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const [{ data: goalData, error: goalError }, costsResult] = await Promise.all([
        supabase
          .from("emergency_goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("profile_type", currentProfile)
          .maybeSingle(),
        supabase
          .from("fixed_costs")
          .select("*")
          .eq("user_id", user.id)
          .eq("profile_type", currentProfile)
          .order("created_at", { ascending: true }),
      ]);

      if (goalError) throw goalError;
      if (costsResult.error) throw costsResult.error;

      const normalizedGoal = goalData
        ? {
            id: goalData.id,
            goal_type: (goalData.goal_type as EmergencyGoal["goal_type"]) || "months",
            target_months: toNumber(goalData.target_months) || 6,
            target_amount: goalData.target_amount === null ? null : toNumber(goalData.target_amount),
            current_amount: toNumber(goalData.current_amount),
          }
        : null;

      setEmergencyGoal(normalizedGoal);
      setFormData({
        goal_type: normalizedGoal?.goal_type || "months",
        target_months: normalizedGoal?.target_months || 6,
        target_amount: normalizedGoal?.target_amount ? String(normalizedGoal.target_amount) : "",
      });
      setFixedCosts((costsResult.data || []).map((cost: any) => ({ ...cost, amount: toNumber(cost.amount) })));
    } catch (error: any) {
      console.error("Error loading emergency reserve:", error);
      toast.error("Erro ao carregar reserva: " + (error?.message || "tente novamente"));
    } finally {
      setCostsLoading(false);
      setLoading(false);
    }
  };

  const handleRefreshCosts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      setCostsLoading(true);
      const { data, error } = await supabase
        .from("fixed_costs")
        .select("*")
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setFixedCosts((data || []).map((cost: any) => ({ ...cost, amount: toNumber(cost.amount) })));
    } catch (error: any) {
      toast.error("Erro ao atualizar custos: " + error.message);
    } finally {
      setCostsLoading(false);
    }
  };

  const monthlyFixedCosts = useMemo(
    () => fixedCosts.filter((cost) => !cost.is_variable).reduce((sum, cost) => sum + toNumber(cost.amount), 0),
    [fixedCosts],
  );

  const monthlyTotalCosts = useMemo(
    () => fixedCosts.reduce((sum, cost) => sum + toNumber(cost.amount), 0),
    [fixedCosts],
  );

  const targetAmount = useMemo(() => {
    if (activeGoal.goal_type === "months") return monthlyFixedCosts * activeGoal.target_months;
    if (activeGoal.goal_type === "amount") return activeGoal.target_amount || 0;
    return Math.max(monthlyFixedCosts * activeGoal.target_months, activeGoal.target_amount || 0);
  }, [activeGoal.goal_type, activeGoal.target_amount, activeGoal.target_months, monthlyFixedCosts]);

  const progress = targetAmount > 0 ? Math.min((activeGoal.current_amount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - activeGoal.current_amount, 0);
  const coveredMonths = monthlyFixedCosts > 0 ? activeGoal.current_amount / monthlyFixedCosts : 0;

  const handleSave = async () => {
    try {
      const validatedData = emergencyGoalSchema.parse({
        goal_type: formData.goal_type,
        target_months: formData.target_months,
        target_amount: formData.target_amount ? Number(formData.target_amount) : undefined,
      });

      setIsSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const payload = {
        goal_type: validatedData.goal_type,
        target_months: validatedData.target_months,
        target_amount: validatedData.target_amount || 0,
        profile_type: currentProfile,
      };

      if (emergencyGoal?.id) {
        const { error } = await supabase.from("emergency_goals").update(payload).eq("id", emergencyGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("emergency_goals").insert({
          user_id: user.id,
          profile_type: currentProfile,
          current_amount: 0,
          ...payload,
        });
        if (error) throw error;
      }

      toast.success("Reserva configurada com sucesso!");
      setIsEditing(false);
      await loadData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const ensureGoalExists = async (userId: string) => {
    if (emergencyGoal?.id) return emergencyGoal.id;

    const { data, error } = await supabase
      .from("emergency_goals")
      .insert({
        user_id: userId,
        profile_type: currentProfile,
        current_amount: 0,
        goal_type: activeGoal.goal_type,
        target_months: activeGoal.target_months,
        target_amount: activeGoal.target_amount || 0,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  };

  const handleUpdateAmount = async (amount: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      setIsUpdatingAmount(true);
      const goalId = await ensureGoalExists(user.id);
      const newAmount = Math.max(0, activeGoal.current_amount + amount);

      const { error } = await supabase.from("emergency_goals").update({ current_amount: newAmount }).eq("id", goalId);
      if (error) throw error;

      const action = amount > 0 ? "adicionado à" : "retirado da";
      toast.success(`${formatCurrency(Math.abs(amount))} ${action} reserva.`);
      setCustomAmount("");
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  const handleCustomAmount = (isAdd: boolean) => {
    const value = Number(String(customAmount).replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    handleUpdateAmount(isAdd ? value : -value);
  };

  const handleUpdateCostAmount = async (costId: string, newAmount: number) => {
    try {
      const { error } = await supabase.from("fixed_costs").update({ amount: newAmount }).eq("id", costId);
      if (error) throw error;
      await handleRefreshCosts();
    } catch (error: any) {
      toast.error("Erro ao atualizar custo: " + error.message);
    }
  };

  const handleProfileChange = (profile: FinancialProfile) => {
    if (profile === "business" && !canUseBusinessProfile()) {
      setShowUpgradeModal(true);
      return;
    }

    setCurrentProfile(profile);
    setIsEditing(false);
    setCustomAmount("");
  };

  if (loading) {
    return (
      <AppLayout
        title="Reserva de Emergência"
        showProfileSwitcher
        currentProfile={currentProfile}
        onProfileChange={handleProfileChange}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Reserva de Emergência"
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={handleProfileChange}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${isPersonal ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
              {isPersonal ? <User className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Reserva de Emergência</h1>
              <p className="text-lg text-muted-foreground">
                Monte uma proteção financeira {isPersonal ? "pessoal" : "empresarial"} para imprevistos.
              </p>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)} className="h-12 rounded-2xl px-8 text-base font-bold">
            <Edit2 className="mr-2 h-5 w-5" />
            Editar Meta
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ReserveKpi
            title="Reserva Atual"
            value={formatCurrency(activeGoal.current_amount)}
            description={`${coveredMonths.toFixed(1)} meses cobertos`}
            icon={Wallet}
            tone="success"
          />
          <ReserveKpi
            title="Meta"
            value={formatCurrency(targetAmount)}
            description={targetAmount > 0 ? `${progress.toFixed(1)}% concluído` : "Configure custos ou valor fixo"}
            icon={Target}
          />
          <ReserveKpi
            title="Faltam"
            value={formatCurrency(remaining)}
            description={remaining > 0 ? "Para atingir a meta" : "Meta atingida"}
            icon={TrendingUp}
            tone="warning"
          />
          <ReserveKpi
            title="Custos Mensais"
            value={formatCurrency(monthlyFixedCosts)}
            description={`${fixedCosts.filter((cost) => !cost.is_variable).length} custos fixos ativos`}
            icon={Receipt}
          />
        </div>

        <Card className="overflow-hidden rounded-2xl border-primary/20 bg-card shadow-sm">
          <CardContent className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">Progresso da reserva</p>
                    <h2 className="text-2xl font-bold text-foreground">
                      {progress >= 100 ? "Reserva completa" : "Continue protegendo seu caixa"}
                    </h2>
                  </div>
                  <p className="text-3xl font-bold text-primary">{progress.toFixed(0)}%</p>
                </div>
                <Progress value={progress} className="h-4 rounded-full" />
                <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:justify-between">
                  <span>{formatCurrency(activeGoal.current_amount)} guardados</span>
                  <span>Meta de {formatCurrency(targetAmount)}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[3, 6, 12].map((months) => {
                  const amount = monthlyFixedCosts * months;
                  const recommendationProgress = amount > 0 ? Math.min((activeGoal.current_amount / amount) * 100, 100) : 0;
                  return (
                    <div key={months} className="rounded-2xl border border-border/80 bg-muted/30 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{months} meses</span>
                        {recommendationProgress >= 100 && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(amount)}</p>
                      <Progress value={recommendationProgress} className="mt-3 h-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Atualizar reserva</h3>
                  <p className="text-sm text-muted-foreground">Registre aportes ou retiradas.</p>
                </div>
              </div>

              <Label htmlFor="reserve-amount">Valor</Label>
              <Input
                id="reserve-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCustomAmount(true);
                }}
                className="mt-2 h-12 rounded-2xl bg-card text-base"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleCustomAmount(true)}
                  disabled={isUpdatingAmount}
                  className="h-12 rounded-2xl font-bold"
                >
                  {isUpdatingAmount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                  Adicionar
                </Button>
                <Button
                  onClick={() => handleCustomAmount(false)}
                  disabled={isUpdatingAmount || activeGoal.current_amount <= 0}
                  variant="outline"
                  className="h-12 rounded-2xl font-bold text-destructive hover:text-destructive"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Retirar
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[100, 200, 500, 1000].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingAmount}
                    onClick={() => handleUpdateAmount(value)}
                    className="rounded-xl bg-card text-xs"
                  >
                    +{value}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing ? (
          <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Configurar Meta de Reserva</CardTitle>
              <CardDescription>Defina se a reserva será calculada por meses, por valor fixo ou pelos dois critérios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={formData.goal_type}
                onValueChange={(value: EmergencyGoal["goal_type"]) => setFormData({ ...formData, goal_type: value })}
                className="grid gap-3 lg:grid-cols-3"
              >
                <Label htmlFor="months" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 p-4 hover:bg-muted/50">
                  <RadioGroupItem value="months" id="months" />
                  <div>
                    <span className="flex items-center gap-2 font-bold">
                      <Calendar className="h-4 w-4 text-primary" />
                      Meses de custos
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">Usa seus custos fixos para calcular a reserva ideal.</p>
                  </div>
                </Label>

                <Label htmlFor="amount" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 p-4 hover:bg-muted/50">
                  <RadioGroupItem value="amount" id="amount" />
                  <div>
                    <span className="flex items-center gap-2 font-bold">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Valor fixo
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">Você define manualmente o valor alvo.</p>
                  </div>
                </Label>

                <Label htmlFor="both" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 p-4 hover:bg-muted/50">
                  <RadioGroupItem value="both" id="both" />
                  <div>
                    <span className="flex items-center gap-2 font-bold">
                      <Shield className="h-4 w-4 text-primary" />
                      Maior valor
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">Usa o maior valor entre meses e alvo manual.</p>
                  </div>
                </Label>
              </RadioGroup>

              <div className="grid gap-4 sm:grid-cols-2">
                {(formData.goal_type === "months" || formData.goal_type === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="target_months">Quantidade de meses</Label>
                    <Input
                      id="target_months"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.target_months}
                      onChange={(event) => setFormData({ ...formData, target_months: Number(event.target.value) || 1 })}
                      className="h-12 rounded-2xl"
                    />
                    <p className="text-sm text-muted-foreground">Custos fixos mensais: {formatCurrency(monthlyFixedCosts)}</p>
                  </div>
                )}

                {(formData.goal_type === "amount" || formData.goal_type === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Valor alvo</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10000.00"
                      value={formData.target_amount}
                      onChange={(event) => setFormData({ ...formData, target_amount: event.target.value })}
                      className="h-12 rounded-2xl"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSave} disabled={isSaving} className="h-12 rounded-2xl px-8 font-bold">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Configuração
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      goal_type: activeGoal.goal_type,
                      target_months: activeGoal.target_months,
                      target_amount: activeGoal.target_amount ? String(activeGoal.target_amount) : "",
                    });
                  }}
                  disabled={isSaving}
                  className="h-12 rounded-2xl px-8 font-bold"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="rounded-2xl border-border/80 bg-card shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Configuração Atual</CardTitle>
                <CardDescription>Resumo do cálculo usado para sua reserva.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Tipo de meta</p>
                  <p className="mt-1 font-bold text-foreground">
                    {activeGoal.goal_type === "months" && "Baseada em meses"}
                    {activeGoal.goal_type === "amount" && "Valor fixo"}
                    {activeGoal.goal_type === "both" && "Maior valor"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Cobertura planejada</p>
                  <p className="mt-1 font-bold text-foreground">{activeGoal.target_months} meses</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Valor alvo manual</p>
                  <p className="mt-1 font-bold text-foreground">{formatCurrency(activeGoal.target_amount || 0)}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Custos mensais totais</p>
                  <p className="mt-1 font-bold text-foreground">{formatCurrency(monthlyTotalCosts)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/20 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Recomendação
                </CardTitle>
                <CardDescription>Especialistas sugerem entre 6 e 12 meses de custos essenciais.</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyFixedCosts > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4">
                      <span className="font-semibold">Mínimo</span>
                      <span className="font-bold text-primary">{formatCurrency(monthlyFixedCosts * 6)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                      <span className="font-semibold">Ideal</span>
                      <span className="font-bold">{formatCurrency(monthlyFixedCosts * 12)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cadastre seus custos fixos abaixo para receber uma recomendação automática.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <FixedCostsManager
          costs={fixedCosts}
          onUpdate={handleRefreshCosts}
          loading={costsLoading}
          currentProfile={currentProfile}
        />

        <VariableCostAnalytics
          variableCosts={fixedCosts.filter((cost) => cost.is_variable)}
          onUpdateCostAmount={handleUpdateCostAmount}
          currentProfile={currentProfile}
        />
      </div>
      <UpgradePrompt
        feature="Controle PF/PJ"
        description="A reserva separada por perfil Pessoal e Empresarial está disponível no plano Pro Plus."
        variant="modal"
        requiredPlan="pro_plus"
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        benefits={["Reserva por perfil", "Custos fixos separados", "Dashboard consolidado", "Relatórios segmentados"]}
      />
    </AppLayout>
  );
};

export default EmergencyReserve;
