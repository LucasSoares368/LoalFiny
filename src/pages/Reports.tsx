import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  PieChart as PieChartIcon,
  List,
  CalendarDays,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TransactionsList } from "@/components/TransactionsList";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { ReportFilters, ReportFiltersState, defaultFilters } from "@/components/reports/ReportFilters";
import { YearlyOverview } from "@/components/reports/YearlyOverview";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";

interface CategorySummary {
  name: string;
  icon: string;
  income: number;
  expense: number;
  total: number;
  count: number;
}

const parseMoneyFilter = (value: string) => {
  if (!value) return null;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatCsvCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const [filters, setFilters] = useState<ReportFiltersState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReportFiltersState>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountBalance, setAccountBalance] = useState(0);
  const { loading: planLoading, canUseReports } = useUserPlan();

  const totals = categoryData.reduce(
    (acc, category) => ({
      income: acc.income + category.income,
      expense: acc.expense + category.expense,
      balance: acc.balance + category.total,
      count: acc.count + category.count,
    }),
    { income: 0, expense: 0, balance: 0, count: 0 },
  );

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [currentProfile, appliedFilters]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const handleApplyFilters = useCallback((nextFilters?: ReportFiltersState) => {
    setAppliedFilters({ ...(nextFilters || filters) });
  }, [filters]);

  const applyFiltersToQuery = (query: any, activeFilters: ReportFiltersState) => {
    let nextQuery = query;

    if (activeFilters.categories.length > 0) {
      nextQuery = nextQuery.in("category_id", activeFilters.categories);
    }
    if (activeFilters.transactionType !== "all") {
      nextQuery = nextQuery.eq("type", activeFilters.transactionType);
    }
    if (activeFilters.dateFrom) {
      nextQuery = nextQuery.gte("date", format(activeFilters.dateFrom, "yyyy-MM-dd"));
    }
    if (activeFilters.dateTo) {
      nextQuery = nextQuery.lte("date", format(activeFilters.dateTo, "yyyy-MM-dd"));
    }

    const minAmount = parseMoneyFilter(activeFilters.minAmount);
    const maxAmount = parseMoneyFilter(activeFilters.maxAmount);
    if (minAmount !== null) nextQuery = nextQuery.gte("amount", minAmount);
    if (maxAmount !== null) nextQuery = nextQuery.lte("amount", maxAmount);

    return nextQuery;
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            icon,
            color
          )
        `)
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile);

      query = applyFiltersToQuery(query, appliedFilters);

      const { data: transactions, error } = await query.order("date", { ascending: false });
      if (error) throw error;

      const { data: bankRows, error: bankError } = await supabase
        .from("banks")
        .select("current_balance")
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile)
        .eq("is_active", true);
      if (bankError) throw bankError;
      setAccountBalance((bankRows || []).reduce((sum: number, bank: any) => sum + Number(bank.current_balance || 0), 0));

      const categoryMap = new Map<string, CategorySummary>();
      (transactions || []).forEach((transaction: any) => {
        const categoryName = transaction.categories?.name || "Sem categoria";
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            name: categoryName,
            icon: transaction.categories?.icon || "📦",
            income: 0,
            expense: 0,
            total: 0,
            count: 0,
          });
        }

        const category = categoryMap.get(categoryName)!;
        const amount = Number(transaction.amount || 0);
        category.count += 1;

        if (transaction.type === "income") {
          category.income += amount;
          category.total += amount;
        } else {
          category.expense += amount;
          category.total -= amount;
        }
      });

      setCategoryData(Array.from(categoryMap.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total)));
    } catch (error: any) {
      toast.error("Erro ao carregar relatórios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("transactions")
        .select(`
          *,
          categories (name, icon),
          banks (name)
        `)
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile);

      query = applyFiltersToQuery(query, appliedFilters);
      const { data: transactions, error } = await query.order("date", { ascending: false });
      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast.error("Nenhuma transação para exportar");
        return;
      }

      const profileLabel = currentProfile === "personal" ? "Pessoal" : "Empresarial";
      const exportDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
      const totalIncome = transactions
        .filter((transaction: any) => transaction.type === "income")
        .reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0);
      const totalExpense = transactions
        .filter((transaction: any) => transaction.type === "expense")
        .reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0);
      const balance = totalIncome - totalExpense;

      const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
      };

      const csvLines: string[] = [
        "RELATÓRIO FINANCEIRO - LOCALFINY",
        `Perfil: ${profileLabel}`,
        `Exportado em: ${exportDate}`,
        `Total de transações: ${transactions.length}`,
        "",
      ];

      const hasFilters =
        appliedFilters.categories.length > 0 ||
        appliedFilters.transactionType !== "all" ||
        appliedFilters.dateFrom ||
        appliedFilters.dateTo ||
        appliedFilters.minAmount ||
        appliedFilters.maxAmount;

      if (hasFilters) {
        csvLines.push("FILTROS APLICADOS:");
        if (appliedFilters.dateFrom || appliedFilters.dateTo) {
          const from = appliedFilters.dateFrom ? format(appliedFilters.dateFrom, "dd/MM/yyyy") : "Início";
          const to = appliedFilters.dateTo ? format(appliedFilters.dateTo, "dd/MM/yyyy") : "Hoje";
          csvLines.push(`Período: ${from} a ${to}`);
        }
        if (appliedFilters.transactionType !== "all") {
          csvLines.push(`Tipo: ${appliedFilters.transactionType === "income" ? "Receitas" : "Despesas"}`);
        }
        if (appliedFilters.minAmount || appliedFilters.maxAmount) {
          const min = appliedFilters.minAmount ? `R$ ${appliedFilters.minAmount}` : "0";
          const max = appliedFilters.maxAmount ? `R$ ${appliedFilters.maxAmount}` : "Sem limite";
          csvLines.push(`Valor: ${min} a ${max}`);
        }
        csvLines.push("");
      }

      csvLines.push("RESUMO");
      csvLines.push(`Total de Receitas:,"R$ ${formatCsvCurrency(totalIncome)}"`);
      csvLines.push(`Total de Despesas:,"R$ ${formatCsvCurrency(totalExpense)}"`);
      csvLines.push(`Saldo:,"R$ ${formatCsvCurrency(balance)}"`);
      csvLines.push("");
      csvLines.push("TRANSAÇÕES DETALHADAS");
      csvLines.push("Data,Hora,Tipo,Valor,Categoria,Banco/Cartão,Meio de Pagamento,Descrição");

      transactions.forEach((transaction: any) => {
        const row = [
          formatDate(transaction.date),
          transaction.transaction_time ? transaction.transaction_time.slice(0, 5) : "",
          transaction.type === "income" ? "Receita" : "Despesa",
          `R$ ${formatCsvCurrency(Number(transaction.amount || 0))}`,
          transaction.categories?.name || "Sem categoria",
          transaction.banks?.name || "",
          transaction.payment_method || "",
          (transaction.description || "").replace(/"/g, '""'),
        ];
        csvLines.push(row.map((cell) => `"${cell}"`).join(","));
      });

      csvLines.push("");
      csvLines.push("---");
      csvLines.push("Gerado automaticamente pelo LocalFiny");

      const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `LocalFiny_${profileLabel}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao exportar: " + error.message);
    }
  };

  if (!planLoading && !canUseReports()) {
    return (
      <AppLayout title="Relatórios">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <PieChartIcon className="h-7 w-7 text-primary" />
              Relatórios
            </h1>
            <p className="text-lg text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>

          <UpgradePrompt
            feature="Relatórios Financeiros"
            description="Acesse relatórios detalhados, análises por categoria, exportação para CSV e muito mais."
            requiredPlan="pro"
            benefits={["Relatórios inteligentes", "Exportação CSV", "Projeção de fluxo de caixa", "Planejamento mensal"]}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={setCurrentProfile}
      title="Relatórios"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <PieChartIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Relatórios</h1>
              <p className="text-lg text-muted-foreground">Análise detalhada das suas finanças</p>
            </div>
          </div>

          <Button onClick={exportToCSV} className="h-12 shrink-0 rounded-2xl px-8 text-base font-bold">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Receitas" value={formatCurrency(totals.income)} icon={TrendingUp} tone="success" />
            <SummaryCard title="Despesas" value={formatCurrency(totals.expense)} icon={TrendingDown} tone="danger" />
            <SummaryCard title="Saldo em contas" value={formatCurrency(accountBalance)} icon={Wallet} tone={accountBalance >= 0 ? "success" : "danger"} />
            <SummaryCard title="Transações" value={String(totals.count)} icon={List} tone="primary" />
          </div>
        )}

        <ReportFilters
          profileType={currentProfile}
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
        />

        <Tabs defaultValue="yearly" className="space-y-6">
          <TabsList className="grid h-12 w-full max-w-xl grid-cols-3 rounded-2xl bg-muted p-1">
            <TabsTrigger value="yearly" className="gap-2 rounded-xl">
              <CalendarDays className="h-4 w-4" />
              Anual
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2 rounded-xl">
              <PieChartIcon className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 rounded-xl">
              <List className="h-4 w-4" />
              Transações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yearly">
            <YearlyOverview />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Resumo por categoria</CardTitle>
                <CardDescription>Visão geral das suas transações agrupadas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : categoryData.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                    <PieChartIcon className="mb-4 h-16 w-16 text-muted-foreground/35" />
                    <h3 className="text-xl font-bold">Nenhuma transação encontrada</h3>
                    <p className="mt-2 text-muted-foreground">Ajuste os filtros ou registre novas transações.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryData.map((category) => (
                      <div key={category.name} className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                              {category.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold">{category.name}</p>
                              <p className="text-sm text-muted-foreground">{category.count} transação(ões)</p>
                            </div>
                          </div>
                          <p className={`shrink-0 text-lg font-bold ${category.total >= 0 ? "text-success" : "text-danger"}`}>
                            {category.total >= 0 ? "+" : "-"} {formatCurrency(Math.abs(category.total))}
                          </p>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <span className="text-success">Receitas: {formatCurrency(category.income)}</span>
                          <span className="text-danger">Despesas: {formatCurrency(category.expense)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Transações filtradas</CardTitle>
                <CardDescription>
                  {appliedFilters.categories.length > 0 ||
                  appliedFilters.transactionType !== "all" ||
                  appliedFilters.dateFrom ||
                  appliedFilters.dateTo ||
                  appliedFilters.minAmount ||
                  appliedFilters.maxAmount
                    ? "Exibindo transações com base nos filtros aplicados"
                    : "Edite ou exclua suas transações"}
                </CardDescription>
                <div className="relative mt-3 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-12 rounded-2xl pl-12 text-base"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <TransactionsList
                  profileType={currentProfile}
                  filters={{
                    categories: appliedFilters.categories,
                    transactionType: appliedFilters.transactionType,
                    dateFrom: appliedFilters.dateFrom,
                    dateTo: appliedFilters.dateTo,
                    minAmount: appliedFilters.minAmount,
                    maxAmount: appliedFilters.maxAmount,
                  }}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  tone: "success" | "danger" | "primary";
}

const SummaryCard = ({ title, value, icon: Icon, tone }: SummaryCardProps) => {
  const toneClass = {
    success: "text-success bg-success/10",
    danger: "text-danger bg-danger/10",
    primary: "text-primary bg-primary/10",
  }[tone];

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardContent className="flex min-h-[128px] flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted-foreground">{title}</span>
          <div className={`rounded-xl p-3 ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className={`truncate text-2xl font-bold sm:text-3xl ${toneClass.split(" ")[0]}`}>{value}</p>
      </CardContent>
    </Card>
  );
};

export default Reports;
