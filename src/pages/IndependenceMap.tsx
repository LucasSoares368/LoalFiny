import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Flame,
  Landmark,
  Loader2,
  Lock,
  Map,
  Medal,
  PiggyBank,
  Receipt,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-financial-journey.jpg";

type AchievementCategory = "start" | "cashflow" | "reserve" | "goals" | "debts" | "organization";

interface Achievement {
  type: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  category: AchievementCategory;
  actionLabel: string;
  actionPath: string;
}

interface JourneyStats {
  transactions: any[];
  banks: any[];
  goals: any[];
  debts: any[];
  emergencyGoal: any | null;
  fixedCosts: any[];
}

const categories: Record<AchievementCategory, { label: string; description: string; icon: typeof Trophy }> = {
  start: {
    label: "Primeiros Passos",
    description: "Base inicial para começar a organizar sua vida financeira.",
    icon: Sparkles,
  },
  cashflow: {
    label: "Fluxo de Caixa",
    description: "Receitas e despesas registradas com consistência.",
    icon: Receipt,
  },
  reserve: {
    label: "Reserva de Emergência",
    description: "Proteção para imprevistos e meses difíceis.",
    icon: Shield,
  },
  goals: {
    label: "Metas",
    description: "Objetivos financeiros acompanhados até a conclusão.",
    icon: Target,
  },
  debts: {
    label: "Dívidas",
    description: "Controle e redução de compromissos em aberto.",
    icon: CreditCard,
  },
  organization: {
    label: "Organização",
    description: "Estrutura que deixa o painel mais confiável.",
    icon: Map,
  },
};

const levelRoadmap = [
  { threshold: 0, label: "Começando a Jornada", icon: Sparkles },
  { threshold: 100, label: "Finanças Organizadas", icon: Wallet },
  { threshold: 250, label: "Controle Consistente", icon: Flame },
  { threshold: 500, label: "Estratégia Financeira", icon: Medal },
  { threshold: 800, label: "Independência em Construção", icon: Trophy },
];

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isPaidDebt = (debt: any) => {
  const status = String(debt?.status || "").toLowerCase();
  return ["paid", "quitada", "paga", "concluida", "concluída"].includes(status) || toNumber(debt?.current_balance) <= 0;
};

const getMonthKey = (date: string) => String(date || "").slice(0, 7);

const buildAchievements = (stats: JourneyStats): Achievement[] => {
  const transactionCount = stats.transactions.length;
  const incomeTransactions = stats.transactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = stats.transactions.filter((transaction) => transaction.type === "expense");
  const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const activeBanks = stats.banks.filter((bank) => bank.is_active !== false && bank.is_active !== 0);
  const completedGoals = stats.goals.filter((goal) => goal.is_completed);
  const paidDebts = stats.debts.filter(isPaidDebt);
  const monthlyFixedCosts = stats.fixedCosts
    .filter((cost) => !cost.is_variable)
    .reduce((sum, cost) => sum + toNumber(cost.amount), 0);
  const reserveAmount = toNumber(stats.emergencyGoal?.current_amount);
  const reserveMonths = monthlyFixedCosts > 0 ? reserveAmount / monthlyFixedCosts : 0;

  const monthlyResult = new Map<string, { income: number; expense: number }>();
  for (const transaction of stats.transactions) {
    const key = getMonthKey(transaction.date || transaction.created_at);
    if (!key) continue;
    const entry = monthlyResult.get(key) || { income: 0, expense: 0 };
    if (transaction.type === "income") entry.income += toNumber(transaction.amount);
    if (transaction.type === "expense") entry.expense += toNumber(transaction.amount);
    monthlyResult.set(key, entry);
  }
  const positiveMonths = Array.from(monthlyResult.values()).filter((month) => month.income > 0 && month.income >= month.expense).length;

  return [
    {
      type: "first_bank",
      title: "Primeira conta cadastrada",
      description: "Cadastre pelo menos um banco ou carteira para consolidar seu saldo.",
      points: 25,
      unlocked: activeBanks.length > 0,
      category: "start",
      actionLabel: "Ir para bancos",
      actionPath: "/banks",
    },
    {
      type: "first_transaction",
      title: "Primeira movimentação",
      description: "Registre uma receita ou despesa para começar seu histórico financeiro.",
      points: 25,
      unlocked: transactionCount > 0,
      category: "start",
      actionLabel: "Registrar transação",
      actionPath: "/transactions",
    },
    {
      type: "first_income",
      title: "Primeira receita registrada",
      description: "Tenha clareza sobre a origem do dinheiro que entra.",
      points: 30,
      unlocked: incomeTransactions.length > 0,
      category: "cashflow",
      actionLabel: "Adicionar receita",
      actionPath: "/transactions",
    },
    {
      type: "ten_transactions",
      title: "10 transações registradas",
      description: "Quanto mais histórico, melhores ficam seus relatórios.",
      points: 50,
      unlocked: transactionCount >= 10,
      category: "cashflow",
      actionLabel: "Ver transações",
      actionPath: "/transactions",
    },
    {
      type: "fifty_transactions",
      title: "50 transações registradas",
      description: "Você já tem uma base relevante para analisar padrões.",
      points: 100,
      unlocked: transactionCount >= 50,
      category: "cashflow",
      actionLabel: "Ver relatórios",
      actionPath: "/reports",
    },
    {
      type: "positive_month",
      title: "Mês positivo",
      description: "Feche pelo menos um mês com receitas maiores ou iguais às despesas.",
      points: 75,
      unlocked: positiveMonths >= 1 || totalIncome >= totalExpense && totalIncome > 0,
      category: "cashflow",
      actionLabel: "Ver relatórios",
      actionPath: "/reports",
    },
    {
      type: "fixed_costs",
      title: "Custos essenciais mapeados",
      description: "Cadastre seus custos fixos para calcular sua reserva ideal.",
      points: 40,
      unlocked: monthlyFixedCosts > 0,
      category: "reserve",
      actionLabel: "Configurar reserva",
      actionPath: "/emergency-reserve",
    },
    {
      type: "reserve_started",
      title: "Reserva iniciada",
      description: "Guarde qualquer valor para começar sua proteção financeira.",
      points: 50,
      unlocked: reserveAmount > 0,
      category: "reserve",
      actionLabel: "Atualizar reserva",
      actionPath: "/emergency-reserve",
    },
    {
      type: "reserve_one_month",
      title: "1 mês protegido",
      description: "Tenha ao menos um mês de custos fixos guardado.",
      points: 100,
      unlocked: reserveMonths >= 1,
      category: "reserve",
      actionLabel: "Ver reserva",
      actionPath: "/emergency-reserve",
    },
    {
      type: "reserve_six_months",
      title: "Reserva recomendada",
      description: "Alcance seis meses de custos essenciais guardados.",
      points: 200,
      unlocked: reserveMonths >= 6,
      category: "reserve",
      actionLabel: "Ver reserva",
      actionPath: "/emergency-reserve",
    },
    {
      type: "first_goal",
      title: "Primeira meta criada",
      description: "Transforme planos em objetivos mensuráveis.",
      points: 40,
      unlocked: stats.goals.length > 0,
      category: "goals",
      actionLabel: "Criar meta",
      actionPath: "/goals",
    },
    {
      type: "goal_with_progress",
      title: "Meta em movimento",
      description: "Faça um aporte em qualquer meta ativa.",
      points: 75,
      unlocked: stats.goals.some((goal) => toNumber(goal.current_amount) > 0),
      category: "goals",
      actionLabel: "Ver metas",
      actionPath: "/goals",
    },
    {
      type: "goal_completed",
      title: "Meta concluída",
      description: "Finalize pelo menos um objetivo financeiro.",
      points: 150,
      unlocked: completedGoals.length > 0,
      category: "goals",
      actionLabel: "Ver metas",
      actionPath: "/goals",
    },
    {
      type: "first_debt",
      title: "Dívida mapeada",
      description: "Cadastre uma dívida para acompanhar sua quitação.",
      points: 35,
      unlocked: stats.debts.length > 0,
      category: "debts",
      actionLabel: "Ir para dívidas",
      actionPath: "/debts",
    },
    {
      type: "debt_payment",
      title: "Dívida em redução",
      description: "Registre pagamento ou mantenha saldo menor que o valor original.",
      points: 75,
      unlocked: stats.debts.some((debt) => toNumber(debt.current_balance) < toNumber(debt.total_amount)),
      category: "debts",
      actionLabel: "Pagar dívida",
      actionPath: "/debts",
    },
    {
      type: "debt_free",
      title: "Dívida quitada",
      description: "Quite pelo menos uma dívida cadastrada.",
      points: 150,
      unlocked: paidDebts.length > 0,
      category: "debts",
      actionLabel: "Ver dívidas",
      actionPath: "/debts",
    },
    {
      type: "active_bank_balance",
      title: "Saldo centralizado",
      description: "Mantenha pelo menos uma conta ativa com saldo informado.",
      points: 40,
      unlocked: activeBanks.some((bank) => toNumber(bank.current_balance) !== 0),
      category: "organization",
      actionLabel: "Ver bancos",
      actionPath: "/banks",
    },
    {
      type: "full_structure",
      title: "Sistema conectado",
      description: "Tenha bancos, transações, metas, dívidas e reserva usando dados reais.",
      points: 150,
      unlocked: activeBanks.length > 0 && transactionCount > 0 && stats.goals.length > 0 && stats.debts.length > 0 && reserveAmount > 0,
      category: "organization",
      actionLabel: "Ver dashboard",
      actionPath: "/dashboard",
    },
  ];
};

const getLevel = (points: number) => {
  const currentIndex = Math.max(
    0,
    levelRoadmap.findLastIndex((level) => points >= level.threshold),
  );
  const current = levelRoadmap[currentIndex];
  const next = levelRoadmap[currentIndex + 1] || current;
  const previousThreshold = current.threshold;
  const nextThreshold = next.threshold;
  const levelProgress =
    nextThreshold === previousThreshold
      ? 100
      : Math.min(((points - previousThreshold) / (nextThreshold - previousThreshold)) * 100, 100);

  return { current, next, levelProgress, nextThreshold };
};

function JourneyKpi({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Trophy;
}) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardContent className="flex min-h-[124px] flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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

const IndependenceMap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<JourneyStats | null>(null);

  useEffect(() => {
    loadJourney();
  }, []);

  const loadJourney = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const [transactions, banks, goals, debts, emergencyGoal, fixedCosts] = await Promise.all([
        supabase.from("transactions").select("id, amount, type, date, created_at").order("date", { ascending: false }),
        supabase.from("banks").select("id, current_balance, is_active").order("created_at", { ascending: false }),
        supabase.from("custom_goals").select("id, current_amount, target_amount, is_completed").order("created_at", { ascending: false }),
        supabase.from("debts").select("id, current_balance, total_amount, status").order("created_at", { ascending: false }),
        supabase.from("emergency_goals").select("id, current_amount, target_amount, target_months, goal_type").maybeSingle(),
        supabase.from("fixed_costs").select("id, amount, is_variable").order("created_at", { ascending: false }),
      ]);

      const firstError = [transactions, banks, goals, debts, emergencyGoal, fixedCosts].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      setStats({
        transactions: transactions.data || [],
        banks: banks.data || [],
        goals: goals.data || [],
        debts: debts.data || [],
        emergencyGoal: emergencyGoal.data || null,
        fixedCosts: fixedCosts.data || [],
      });
    } catch (error: any) {
      console.error("Error loading financial journey:", error);
      toast.error("Erro ao carregar jornada financeira: " + (error?.message || "tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const achievements = useMemo(() => (stats ? buildAchievements(stats) : []), [stats]);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
  const totalPossiblePoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
  const completion = achievements.length ? (unlockedAchievements.length / achievements.length) * 100 : 0;
  const level = getLevel(totalPoints);
  const LevelIcon = level.current.icon;

  const groupedAchievements = useMemo(() => {
    return Object.keys(categories).map((key) => {
      const categoryKey = key as AchievementCategory;
      const items = achievements.filter((achievement) => achievement.category === categoryKey);
      return {
        key: categoryKey,
        ...categories[categoryKey],
        items,
        unlockedCount: items.filter((item) => item.unlocked).length,
      };
    });
  }, [achievements]);

  const nextAchievement = achievements.find((achievement) => !achievement.unlocked);

  if (loading) {
    return (
      <AppLayout title="Jornada Financeira">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) {
    return (
      <AppLayout title="Jornada Financeira">
        <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-8 text-center shadow-sm">
          <Loader2 className="mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Não foi possível carregar sua jornada</h1>
          <p className="mt-2 text-muted-foreground">Tente novamente para recalcular suas conquistas.</p>
          <Button onClick={loadJourney} className="mt-6 rounded-2xl px-8">
            Recarregar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Jornada Financeira">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
          <img src={heroImage} alt="Jornada financeira" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/20" />
          <div className="relative grid min-h-[300px] gap-8 p-6 text-white lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
            <div className="flex flex-col justify-end">
              <Badge className="mb-4 w-fit rounded-full bg-primary text-primary-foreground hover:bg-primary">
                Jornada LocalFiny
              </Badge>
              <h1 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-5xl">Sua evolução financeira em um mapa claro</h1>
              <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                Acompanhe conquistas geradas a partir de bancos, transações, metas, dívidas e reserva de emergência.
              </p>
            </div>

            <div className="self-end rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <LevelIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Nível atual</p>
                  <p className="text-xl font-bold">{level.current.label}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm text-white/75">
                  <span>{totalPoints} pontos</span>
                  <span>{level.nextThreshold} pts</span>
                </div>
                <Progress value={level.levelProgress} className="h-3 bg-white/20" />
                <p className="mt-3 text-sm text-white/70">
                  {level.levelProgress >= 100
                    ? "Você chegou ao maior nível disponível hoje."
                    : `${Math.round(level.levelProgress)}% até ${level.next.label}.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <JourneyKpi
            label="Pontos"
            value={String(totalPoints)}
            description={`${totalPossiblePoints} pontos possíveis`}
            icon={Trophy}
          />
          <JourneyKpi
            label="Conquistas"
            value={`${unlockedAchievements.length}/${achievements.length}`}
            description={`${completion.toFixed(0)}% da jornada concluída`}
            icon={CheckCircle2}
          />
          <JourneyKpi
            label="Bancos Ativos"
            value={String(stats.banks.filter((bank) => bank.is_active !== false && bank.is_active !== 0).length)}
            description="Contas conectadas ao mapa"
            icon={Landmark}
          />
          <JourneyKpi
            label="Reserva"
            value={formatCurrency(toNumber(stats.emergencyGoal?.current_amount))}
            description="Proteção financeira acumulada"
            icon={PiggyBank}
          />
        </div>

        {nextAchievement && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Próximo passo</p>
                  <h2 className="text-xl font-bold text-foreground">{nextAchievement.title}</h2>
                  <p className="mt-1 text-muted-foreground">{nextAchievement.description}</p>
                </div>
              </div>
              <Button onClick={() => navigate(nextAchievement.actionPath)} className="h-12 rounded-2xl px-6 font-bold">
                {nextAchievement.actionLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {groupedAchievements.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            const categoryProgress = category.items.length ? (category.unlockedCount / category.items.length) * 100 : 0;

            return (
              <motion.section
                key={category.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.05 }}
              >
                <Card className="h-full rounded-2xl border-border/80 bg-card shadow-sm">
                  <CardContent className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">{category.label}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant={category.unlockedCount === category.items.length ? "default" : "secondary"} className="rounded-full">
                        {category.unlockedCount}/{category.items.length}
                      </Badge>
                    </div>

                    <Progress value={categoryProgress} className="h-2" />

                    <div className="space-y-3">
                      {category.items.map((achievement) => (
                        <div
                          key={achievement.type}
                          className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                            achievement.unlocked
                              ? "border-primary/20 bg-primary/5"
                              : "border-border/70 bg-muted/30"
                          }`}
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              achievement.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {achievement.unlocked ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-foreground">{achievement.title}</p>
                              {achievement.unlocked && <Sparkles className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={achievement.unlocked ? "font-bold text-primary" : "font-bold text-muted-foreground"}>
                              {achievement.points}
                            </p>
                            <p className="text-xs text-muted-foreground">pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            );
          })}
        </div>

        <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-5">
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/banks")}>
              <Landmark className="mr-2 h-4 w-4" />
              Bancos
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/transactions")}>
              <Banknote className="mr-2 h-4 w-4" />
              Transações
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/goals")}>
              <Target className="mr-2 h-4 w-4" />
              Metas
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/debts")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Dívidas
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => navigate("/emergency-reserve")}>
              <Shield className="mr-2 h-4 w-4" />
              Reserva
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IndependenceMap;
