import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Loader2,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { useUserPlan } from "@/hooks/useUserPlan";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  color: string;
  icon: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  profile_type: "personal" | "business";
  goal_mode: "transfer" | "expense";
  destination_bank_id: string | null;
  debt_id: string | null;
}

interface Bank {
  id: string;
  name: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
}

interface Debt {
  id: string;
  name: string;
  current_balance: number;
  status: string;
}

const goalSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  target_amount: z.number().positive("Valor deve ser maior que zero").max(999999999.99, "Valor muito alto"),
  current_amount: z.number().min(0, "Valor não pode ser negativo").max(999999999.99, "Valor muito alto"),
  deadline: z.string().optional(),
  category: z.string().max(50).optional(),
  goal_mode: z.enum(["transfer", "expense"]),
  destination_bank_id: z.string().optional(),
  debt_id: z.string().optional(),
});

const goalCategories = [
  { value: "Emergência", label: "Emergência", icon: "!", color: "#ef4444" },
  { value: "Viagem", label: "Viagem", icon: "V", color: "#3b82f6" },
  { value: "Educação", label: "Educação", icon: "E", color: "#8b5cf6" },
  { value: "Casa", label: "Casa", icon: "C", color: "#f59e0b" },
  { value: "Veículo", label: "Veículo", icon: "A", color: "#10b981" },
  { value: "Investimento", label: "Investimento", icon: "$", color: "#06b6d4" },
  { value: "Saúde", label: "Saúde", icon: "+", color: "#ec4899" },
  { value: "Outro", label: "Outro", icon: "M", color: "#ff6a00" },
];

const emptyForm = () => ({
  name: "",
  description: "",
  target_amount: 0,
  current_amount: 0,
  deadline: "",
  category: "Outro",
  goal_mode: "expense" as "transfer" | "expense",
  destination_bank_id: "",
  debt_id: "",
});

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getToday = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const normalizeGoal = (goal: any): Goal => ({
  ...goal,
  name: goal?.name || "Meta",
  description: goal?.description || null,
  target_amount: toNumber(goal?.target_amount),
  current_amount: toNumber(goal?.current_amount),
  deadline: goal?.deadline || null,
  category: goal?.category || "Outro",
  color: goal?.color || "#ff6a00",
  icon: goal?.icon || "M",
  is_completed: goal?.is_completed === true || goal?.is_completed === 1,
  completed_at: goal?.completed_at || null,
  profile_type: goal?.profile_type === "business" ? "business" : "personal",
  goal_mode: goal?.goal_mode === "transfer" ? "transfer" : "expense",
  destination_bank_id: goal?.destination_bank_id || null,
  debt_id: goal?.debt_id || null,
});

const calculateProgress = (current: number, target: number) => {
  if (!target) return 0;
  return Math.min((current / target) * 100, 100);
};

const shouldDefaultGoalToTransfer = (goal: Goal) => {
  if (goal.goal_mode === "transfer") return true;
  const category = normalizeText(goal.category || "");
  const name = normalizeText(goal.name || "");
  return ["investimento", "emergencia", "reserva"].some((term) => category.includes(term) || name.includes(term));
};

const getDaysRemaining = (deadline: string | null) => {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

function GoalKpi({
  title,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Target;
  tone?: "primary" | "success" | "danger";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/15 text-emerald-600",
    danger: "bg-red-500/15 text-red-500",
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-red-500" : "text-foreground"}`}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

const Goals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [contributionBankId, setContributionBankId] = useState("");
  const [contributionDestinationBankId, setContributionDestinationBankId] = useState("");
  const [contributionMode, setContributionMode] = useState<"transfer" | "expense">("expense");
  const [contributionPaymentMethod, setContributionPaymentMethod] = useState("pix");
  const [contributionNotes, setContributionNotes] = useState("");
  const [contributionSaving, setContributionSaving] = useState(false);
  const { plan, usage, loading: planLoading, canAddGoal, canUseBusinessProfile, refetch: refetchPlan } = useUserPlan();
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };

    checkAuth();
  }, [navigate]);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("custom_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(
        (data || [])
          .map(normalizeGoal)
          .filter((goal) => goal.profile_type === currentProfile),
      );
    } catch (error: any) {
      toast.error("Erro ao carregar metas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const loadBanks = useCallback(async () => {
    try {
      setBanksLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("banks")
        .select("id, name, account_type, current_balance, is_active")
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      setBanks((data || []).map((bank: any) => ({
        id: bank.id,
        name: bank.name || "Banco",
        account_type: bank.account_type || "checking",
        current_balance: toNumber(bank.current_balance),
        is_active: bank.is_active !== false && bank.is_active !== 0,
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar bancos: " + error.message);
    } finally {
      setBanksLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  const loadDebts = useCallback(async () => {
    try {
      setDebtsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("debts")
        .select("id, name, current_balance, status")
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile)
        .eq("status", "active")
        .order("current_balance", { ascending: false });

      if (error) throw error;

      setDebts((data || []).map((debt: any) => ({
        id: debt.id,
        name: debt.name || "Dívida",
        current_balance: toNumber(debt.current_balance),
        status: debt.status || "active",
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar dívidas: " + error.message);
    } finally {
      setDebtsLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const filteredGoals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return goals;
    return goals.filter((goal) =>
      [goal.name, goal.description, goal.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [goals, searchQuery]);

  const activeGoals = filteredGoals.filter((goal) => !goal.is_completed);
  const completedGoals = filteredGoals.filter((goal) => goal.is_completed);
  const allActiveGoals = goals.filter((goal) => !goal.is_completed);
  const allCompletedGoals = goals.filter((goal) => goal.is_completed);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const globalProgress = calculateProgress(totalSaved, totalTarget);

  const openCreateDialog = () => {
    if (planLoading) {
      return;
    }

    if (!canAddGoal()) {
      toast.error(`Limite de ${plan.max_goals} metas atingido. Faça upgrade para adicionar mais.`);
      navigate("/upgrade");
      return;
    }

    setEditingGoal(null);
    setFormData(emptyForm());
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || "",
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline || "",
      category: goal.category || "Outro",
      goal_mode: goal.goal_mode || "expense",
      destination_bank_id: goal.destination_bank_id || "",
      debt_id: goal.debt_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const validatedData = goalSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount,
        deadline: formData.deadline || undefined,
        category: formData.category,
        goal_mode: formData.goal_mode,
        destination_bank_id: formData.destination_bank_id || undefined,
        debt_id: formData.debt_id || undefined,
      });

      setIsSaving(true);

      if (validatedData.goal_mode === "transfer" && !validatedData.destination_bank_id) {
        toast.error("Selecione o banco de destino da meta");
        setIsSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const categoryData = goalCategories.find((category) => category.value === formData.category);
      const isCompleted = validatedData.current_amount >= validatedData.target_amount;
      const goalData = {
        name: validatedData.name,
        description: validatedData.description || null,
        target_amount: validatedData.target_amount,
        current_amount: validatedData.current_amount,
        deadline: validatedData.deadline || null,
        category: validatedData.category || "Outro",
        user_id: user.id,
        profile_type: currentProfile,
        goal_mode: validatedData.goal_mode,
        destination_bank_id: validatedData.goal_mode === "transfer" ? validatedData.destination_bank_id || null : null,
        debt_id: validatedData.goal_mode === "expense" ? validatedData.debt_id || null : null,
        color: categoryData?.color || "#ff6a00",
        icon: categoryData?.icon || "M",
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      };

      const { error } = editingGoal
        ? await supabase.from("custom_goals").update(goalData).eq("id", editingGoal.id)
        : await supabase.from("custom_goals").insert(goalData);

      if (error) throw error;

      toast.success(editingGoal ? "Meta atualizada!" : "Meta criada!");
      setIsDialogOpen(false);
      await loadGoals();
      if (!editingGoal) refetchPlan();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao salvar meta: " + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;

    try {
      const { error } = await supabase.from("custom_goals").delete().eq("id", goalToDelete);
      if (error) throw error;
      toast.success("Meta excluída!");
      await loadGoals();
      refetchPlan();
    } catch (error: any) {
      toast.error("Erro ao excluir meta: " + error.message);
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleUpdateProgress = async (goal: Goal, addAmount: number) => {
    if (!Number.isFinite(addAmount) || addAmount <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    const newAmount = Math.min(goal.current_amount + addAmount, goal.target_amount);
    const isCompleted = newAmount >= goal.target_amount;

    try {
      const { error } = await supabase
        .from("custom_goals")
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", goal.id);

      if (error) throw error;

      toast.success(isCompleted ? "Meta concluída!" : "Progresso atualizado!");
      setQuickAmounts((prev) => ({ ...prev, [goal.id]: 0 }));
      loadGoals();
    } catch (error: any) {
      toast.error("Erro ao atualizar progresso: " + error.message);
    }
  };

  const getGoalsCategoryId = async (userId: string) => {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    if (error) throw error;

    const existing = (categories || []).find((category: any) => normalizeText(category.name || "") === "metas");
    if (existing?.id) return existing.id;

    const { data: createdCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Metas",
        icon: "🎯",
        color: "#ff6a00",
        profile_type: currentProfile,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    return createdCategory?.id || null;
  };

  const getDebtCategoryId = async (userId: string) => {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    if (error) throw error;

    const existing = (categories || []).find((category: any) => normalizeText(category.name || "") === "dividas");
    if (existing?.id) return existing.id;

    const { data: createdCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Dívidas",
        icon: "💳",
        color: "#ef4444",
        profile_type: currentProfile,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    return createdCategory?.id || null;
  };

  const openContributionDialog = (goal: Goal) => {
    const onlyBank = banks.length === 1 ? banks[0] : null;
    const defaultMode = shouldDefaultGoalToTransfer(goal) ? "transfer" : "expense";
    setContributionGoal(goal);
    setContributionAmount(0);
    setContributionBankId(onlyBank?.id || "");
    setContributionDestinationBankId(defaultMode === "transfer" ? goal.destination_bank_id || "" : "");
    setContributionMode(defaultMode);
    setContributionPaymentMethod(defaultMode === "transfer" ? "goal_transfer" : onlyBank?.account_type === "credit_card" ? "credit_card" : "pix");
    setContributionNotes("");
  };

  const handleContributionSubmit = async () => {
    if (!contributionGoal) return;

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    if (!contributionBankId) {
      toast.error("Selecione o banco ou cartão da meta");
      return;
    }

    if (contributionMode === "transfer" && !contributionDestinationBankId) {
      toast.error("Selecione o banco de destino da meta");
      return;
    }

    if (contributionMode === "transfer" && contributionDestinationBankId === contributionBankId) {
      toast.error("O banco de destino precisa ser diferente da origem");
      return;
    }

    try {
      setContributionSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const selectedBank = banks.find((bank) => bank.id === contributionBankId);
      if (!selectedBank) throw new Error("Banco selecionado não encontrado");

      const destinationBank = banks.find((bank) => bank.id === contributionDestinationBankId);
      if (contributionMode === "transfer" && !destinationBank) throw new Error("Banco de destino nao encontrado");
      const linkedDebt = contributionGoal.debt_id ? debts.find((debt) => debt.id === contributionGoal.debt_id) : null;

      if (linkedDebt && contributionAmount > linkedDebt.current_balance) {
        toast.error("Valor maior que o saldo devedor da dívida");
        return;
      }

      const newAmount = Math.min(contributionGoal.current_amount + contributionAmount, contributionGoal.target_amount);
      const isCompleted = newAmount >= contributionGoal.target_amount;
      const isTransfer = contributionMode === "transfer";
      const categoryId = linkedDebt ? await getDebtCategoryId(user.id) : await getGoalsCategoryId(user.id);
      const contributionLabel = isTransfer && destinationBank
        ? `Transferencia para meta: ${contributionGoal.name} -> ${destinationBank.name}`
        : linkedDebt
          ? `Pagamento de dívida pela meta: ${contributionGoal.name} -> ${linkedDebt.name}`
          : `Aporte em meta: ${contributionGoal.name}`;

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: contributionAmount,
          type: isTransfer ? "transfer" : "expense",
          category_id: categoryId,
          description: contributionNotes.trim()
            ? `${contributionLabel} - ${contributionNotes.trim()}`
            : contributionLabel,
          date: getToday(),
          transaction_time: getCurrentTime(),
          profile_type: currentProfile,
          bank_id: contributionBankId,
          payment_method: isTransfer ? "goal_transfer" : contributionPaymentMethod,
          is_essential: !!linkedDebt,
        })
        .select("id")
        .single();

      if (transactionError) throw transactionError;

      const { error: bankError } = await supabase
        .from("banks")
        .update({ current_balance: selectedBank.current_balance - contributionAmount })
        .eq("id", contributionBankId);

      if (bankError) throw bankError;

      if (isTransfer && destinationBank) {
        const { error: destinationBankError } = await supabase
          .from("banks")
          .update({ current_balance: destinationBank.current_balance + contributionAmount })
          .eq("id", destinationBank.id);

        if (destinationBankError) throw destinationBankError;
      }

      if (linkedDebt) {
        const newDebtBalance = Math.max(linkedDebt.current_balance - contributionAmount, 0);
        const { error: paymentError } = await supabase.from("debt_payments").insert({
          debt_id: linkedDebt.id,
          bank_id: contributionBankId,
          transaction_id: transaction?.id || null,
          user_id: user.id,
          amount: contributionAmount,
          payment_date: getToday(),
          payment_method: contributionPaymentMethod,
          profile_type: currentProfile,
          notes: contributionNotes.trim() || `Pagamento pela meta ${contributionGoal.name}`,
        });

        if (paymentError) throw paymentError;

        const { error: debtError } = await supabase
          .from("debts")
          .update({
            current_balance: newDebtBalance,
            status: newDebtBalance <= 0 ? "paid" : "active",
          })
          .eq("id", linkedDebt.id);

        if (debtError) throw debtError;
      }

      const { error: goalError } = await supabase
        .from("custom_goals")
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", contributionGoal.id);

      if (goalError) throw goalError;

      toast.success(linkedDebt && isCompleted ? "Meta concluída e dívida atualizada!" : isCompleted ? "Meta concluída!" : "Aporte registrado na meta!");
      setContributionGoal(null);
      await Promise.all([loadGoals(), loadBanks(), loadDebts()]);
    } catch (error: any) {
      toast.error("Erro ao registrar aporte: " + error.message);
    } finally {
      setContributionSaving(false);
    }
  };

  const shouldShowLimit =
    !planLoading &&
    Number(plan.max_goals || 0) < 999 &&
    usage.goals_count >= Math.max(Number(plan.max_goals || 0) - 1, 0);

  const renderGoalCard = (goal: Goal) => {
    const progress = calculateProgress(goal.current_amount, goal.target_amount);
    const daysRemaining = getDaysRemaining(goal.deadline);
    const remainingAmount = Math.max(goal.target_amount - goal.current_amount, 0);

    return (
      <div key={goal.id} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
              style={{ backgroundColor: goal.color }}
            >
              {goal.icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-xl font-bold text-foreground">{goal.name}</h3>
                <Badge variant="outline" className="rounded-full">{goal.category || "Outro"}</Badge>
              </div>
              {goal.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{goal.description}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!goal.is_completed && (
              <Button size="icon" variant="ghost" onClick={() => openEditDialog(goal)} className="h-9 w-9 rounded-xl">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => setGoalToDelete(goal.id)} className="h-9 w-9 rounded-xl text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-primary/10 p-4">
            <p className="text-sm font-medium text-muted-foreground">Guardado</p>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(goal.current_amount)}</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">Meta</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(goal.target_amount)}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold" style={{ color: goal.color }}>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Faltam {formatCurrency(remainingAmount)}</span>
            <span>{goal.is_completed ? "Concluída" : "Em andamento"}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {daysRemaining === null
                ? "Sem prazo"
                : daysRemaining >= 0
                  ? `${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} restante${daysRemaining === 1 ? "" : "s"}`
                  : "Prazo expirado"}
            </span>
          </div>
          {goal.is_completed && goal.completed_at && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Concluída em {new Date(goal.completed_at).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
        </div>

        {!goal.is_completed && (
          <Button
            onClick={() => openContributionDialog(goal)}
            className="mt-5 h-11 w-full rounded-2xl px-6 font-semibold"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Adicionar Valor
          </Button>
        )}
      </div>
    );
  };

  const handleProfileChange = (profile: FinancialProfile) => {
    if (profile === "business" && planLoading) return;
    if (profile === "business" && !canUseBusinessProfile()) return;
    setCurrentProfile(profile);
  };

  return (
    <AppLayout
      title="Metas"
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={handleProfileChange}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Metas</h1>
              <p className="text-lg text-muted-foreground">Acompanhe objetivos financeiros e evolução do dinheiro guardado</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} disabled={planLoading} className="h-12 rounded-2xl px-8 text-base font-bold">
            <Plus className="mr-2 h-5 w-5" />
            Nova Meta
          </Button>
        </div>

        {shouldShowLimit && (
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-foreground">Limite de metas</p>
                <p className="text-sm text-muted-foreground">
                  Você está usando {usage.goals_count} de {plan.max_goals} metas.
                </p>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/upgrade")}>
                Fazer Upgrade
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <GoalKpi title="Metas Ativas" value={String(allActiveGoals.length)} description="Objetivos em andamento" icon={Target} />
          <GoalKpi title="Concluídas" value={String(allCompletedGoals.length)} description="Objetivos alcançados" icon={CheckCircle2} tone="success" />
          <GoalKpi title="Total Guardado" value={formatCurrency(totalSaved)} description={`${globalProgress.toFixed(1)}% do alvo total`} icon={Wallet} tone="success" />
          <GoalKpi title="Valor Alvo" value={formatCurrency(totalTarget)} description="Soma de todas as metas" icon={TrendingUp} />
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar metas..."
            className="h-14 rounded-2xl border-border/80 bg-card pl-14 text-base shadow-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 text-center">
            <Target className="mb-5 h-16 w-16 text-muted-foreground/60" />
            <h2 className="text-2xl font-bold text-foreground">Nenhuma meta criada ainda</h2>
            <p className="mt-2 max-w-md text-lg text-muted-foreground">
              Crie sua primeira meta e acompanhe cada avanço até chegar no objetivo.
            </p>
            <Button onClick={openCreateDialog} disabled={planLoading} className="mt-6 h-12 rounded-2xl px-8 text-base font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeira Meta
            </Button>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-card px-6 text-center shadow-sm">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/60" />
            <h2 className="text-xl font-bold text-foreground">Nenhuma meta encontrada</h2>
            <p className="mt-2 text-muted-foreground">Tente buscar por outro nome, categoria ou descrição.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeGoals.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Metas em Andamento</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {activeGoals.map(renderGoalCard)}
                </div>
              </section>
            )}

            {completedGoals.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Metas Concluídas</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {completedGoals.map(renderGoalCard)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription>
              {editingGoal ? "Atualize os dados da sua meta." : "Crie uma meta financeira personalizada."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Ex: Viagem, entrada da casa..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_amount">Valor da Meta *</Label>
                <CurrencyInput
                  id="target_amount"
                  value={formData.target_amount}
                  onChange={(value) => setFormData({ ...formData, target_amount: value })}
                  placeholder="100.000,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_amount">Valor Atual</Label>
                <CurrencyInput
                  id="current_amount"
                  value={formData.current_amount}
                  onChange={(value) => setFormData({ ...formData, current_amount: value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo da Meta *</Label>
                <Select
                  value={formData.goal_mode}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    goal_mode: value as "transfer" | "expense",
                    destination_bank_id: value === "transfer" ? formData.destination_bank_id : "",
                    debt_id: value === "expense" ? formData.debt_id : "",
                  })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Guardar ou investir</SelectItem>
                    <SelectItem value="expense">Quitar, pagar ou consumir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.goal_mode === "transfer" && (
                <div className="space-y-2">
                  <Label>Banco de destino *</Label>
                  <Select
                    value={formData.destination_bank_id}
                    onValueChange={(value) => setFormData({ ...formData, destination_bank_id: value })}
                    disabled={banksLoading}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione onde guardar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} - {formatCurrency(bank.current_balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.goal_mode === "expense" && (
                <div className="space-y-2">
                  <Label>Dívida vinculada</Label>
                  <Select
                    value={formData.debt_id || "none"}
                    onValueChange={(value) => {
                      const debt = debts.find((item) => item.id === value);
                      setFormData({
                        ...formData,
                        debt_id: value === "none" ? "" : value,
                        target_amount: debt && formData.target_amount <= 0 ? debt.current_balance : formData.target_amount,
                      });
                    }}
                    disabled={debtsLoading}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={debtsLoading ? "Carregando..." : "Opcional"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma dívida</SelectItem>
                      {debts.map((debt) => (
                        <SelectItem key={debt.id} value={debt.id}>
                          {debt.name} - {formatCurrency(debt.current_balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(event) => setFormData({ ...formData, deadline: event.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Anotações sobre esta meta..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formData.description.length}/500</p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-11 rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-11 rounded-2xl font-semibold">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingGoal ? (
                "Atualizar"
              ) : (
                "Criar Meta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contributionGoal} onOpenChange={(open) => !open && setContributionGoal(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Valor</DialogTitle>
            <DialogDescription>
              {contributionGoal ? `Registre um aporte para ${contributionGoal.name}.` : "Registre um aporte na meta."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Tipo de aporte *</Label>
              <Select
                value={contributionMode}
                onValueChange={(value) => {
                  const nextMode = value as "transfer" | "expense";
                  setContributionMode(nextMode);
                  setContributionPaymentMethod(nextMode === "transfer" ? "goal_transfer" : "pix");
                }}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Guardar ou investir em uma conta</SelectItem>
                  <SelectItem value="expense">Quitar, pagar ou consumir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Banco/Cartão *</Label>
              <Select
                value={contributionBankId}
                onValueChange={(value) => {
                  const bank = banks.find((item) => item.id === value);
                  setContributionBankId(value);
                  if (contributionMode === "expense" && bank?.account_type === "credit_card") {
                    setContributionPaymentMethod("credit_card");
                  }
                }}
                disabled={banksLoading}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione de onde saiu o valor"} />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.current_balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {contributionMode === "transfer" && (
              <div className="space-y-2">
                <Label>Banco de destino da meta *</Label>
                <Select
                  value={contributionDestinationBankId}
                  onValueChange={setContributionDestinationBankId}
                  disabled={banksLoading}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione para onde vai o valor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks
                      .filter((bank) => bank.id !== contributionBankId)
                      .map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} - {formatCurrency(bank.current_balance)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor *</Label>
              <CurrencyInput
                value={contributionAmount}
                onChange={setContributionAmount}
                placeholder="0,00"
                className="h-11 rounded-xl"
              />
            </div>

            {contributionMode === "expense" && (
            <div className="space-y-2">
              <Label>Meio de Pagamento</Label>
              <Select value={contributionPaymentMethod} onValueChange={setContributionPaymentMethod}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="debit_card">Débito</SelectItem>
                  <SelectItem value="credit_card">Crédito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={contributionNotes}
                onChange={(event) => setContributionNotes(event.target.value)}
                placeholder="Anotações sobre este aporte..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setContributionGoal(null)} disabled={contributionSaving} className="h-11 rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={handleContributionSubmit} disabled={contributionSaving} className="h-11 rounded-2xl font-semibold">
              {contributionSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todo o progresso registrado nesta meta será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Goals;
