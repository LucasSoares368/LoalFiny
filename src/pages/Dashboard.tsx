import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Calendar,
  Crown,
  DollarSign,
  Eye,
  Landmark,
  LineChart,
  PiggyBank,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useProfile } from "@/hooks/useProfile";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { MarketQuote, useMarketQuotes } from "@/hooks/useMarketQuotes";

type Period = "dia" | "semana" | "mes" | "ano";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const percentOfTotal = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

const formatMarketValue = (quote: MarketQuote) => {
  if (quote.type === "index") {
    return quote.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }

  const currency = quote.currency === "USD" ? "USD" : "BRL";
  return quote.value.toLocaleString("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: quote.maximumFractionDigits ?? 2,
    maximumFractionDigits: quote.maximumFractionDigits ?? (quote.value < 10 ? 3 : 2),
  });
};

const formatMarketChange = (changePercent: number | null) => {
  if (changePercent === null) return "0,00%";
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const firstDayOfWeek = () => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay());
  return date.toISOString().slice(0, 10);
};

const firstDayOfMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
};

const firstDayOfYear = () => `${new Date().getFullYear()}-01-01`;

const getPeriodStart = (period: Period) => {
  if (period === "dia") return todayKey();
  if (period === "semana") return firstDayOfWeek();
  if (period === "ano") return firstDayOfYear();
  return firstDayOfMonth();
};

const currentDateLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);

const currentTimeLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const monthLabel = () =>
  new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date()).replace(/^\w/, (c) => c.toUpperCase());

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("mes");
  const [now, setNow] = useState(() => new Date());
  const { transacoes, loading: loadingTransacoes } = useTransacoes();
  const { accounts } = useBankAccounts();
  const { profile } = useProfile();
  const marketQuotes = useMarketQuotes();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const data = useMemo(() => {
    const start = getPeriodStart(period);
    const filtered = transacoes.filter((item) => item.data.split("T")[0] >= start);
    const receitas = filtered
      .filter((item) => item.tipo === "receita")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const despesas = filtered
      .filter((item) => item.tipo === "despesa")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const saldo = receitas - despesas;
    const expenseRatio = receitas > 0 ? (despesas / receitas) * 100 : 0;

    const categoryTotals = filtered
      .filter((item) => item.tipo === "despesa")
      .reduce<Record<string, number>>((acc, item) => {
        const category = item.categorias?.nome || "Sem categoria";
        acc[category] = (acc[category] || 0) + Number(item.valor || 0);
        return acc;
      }, {});

    return {
      filtered,
      receitas,
      despesas,
      saldo,
      expenseRatio,
      latest: [...filtered].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4),
      categoryTotals,
    };
  }, [period, transacoes]);

  const totalBankBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const savingsRate = data.receitas > 0 ? Math.max(0, (data.saldo / data.receitas) * 100) : 0;
  const userName = profile?.name || "Usuário";

  const businessIncome = 0;
  const businessExpense = 0;
  const totalIncomeDistribution = data.receitas + businessIncome;
  const totalExpenseDistribution = data.despesas + businessExpense;

  return (
    <DashboardLayout>
      <div className="min-h-screen px-5 py-5 md:px-8">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <MarketTicker quotes={marketQuotes.data?.quotes || []} isLoading={marketQuotes.isLoading} />

          <div className="flex items-center gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <Button className="h-9 rounded-xl bg-[#FF6A00] px-5 text-sm font-bold hover:bg-[#e85f00]">
              <UserRound className="mr-2 h-4 w-4" />
              Pessoal
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl px-5 text-sm font-bold text-slate-500">
              <Landmark className="mr-2 h-4 w-4" />
              Empresarial
            </Button>
          </div>
        </header>

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950">Olá, {userName}! 👋</h1>
              <p className="text-sm font-medium text-slate-500">
                Visualizando perfil <span className="font-bold text-[#FF6A00]">Pessoal</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
              <Calendar className="h-4 w-4" />
              {currentDateLabel(now)}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">{currentTimeLabel(now)}</span>
            <Eye className="h-4 w-4" />
          </div>
        </div>

        <section className="mb-5 rounded-3xl border border-[#FF6A00] bg-gradient-to-br from-[#FF6A00]/10 to-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00] text-white">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">Saldo disponível</p>
              <p className="text-sm font-medium text-slate-500">
                Soma de {accounts.length} conta{accounts.length === 1 ? "" : "s"} pessoa{accounts.length === 1 ? "l" : "is"}
              </p>
              <p className="mt-5 text-5xl font-bold text-[#FF6A00]">{formatCurrency(totalBankBalance)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {accounts.length ? "Saldo consolidado das contas cadastradas." : "Cadastre seus bancos para ver o saldo consolidado."}
              </p>
            </div>
          </div>
        </section>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <MiniMetric title="Receitas pessoal" value={data.receitas} icon={TrendingUp} tone="orange" />
          <MiniMetric title="Despesas pessoal" value={data.despesas} icon={TrendingDown} tone="red" />
          <MiniMetric title="Saldo pessoal" value={data.saldo} icon={DollarSign} tone="navy" />
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-3">
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={BarChart3} title="Distribuição financeira" subtitle="Comparativo entre perfil pessoal e empresarial" />
            <Distribution
              label="Distribuição de receitas"
              personalAmount={data.receitas}
              businessAmount={businessIncome}
              personalPercent={percentOfTotal(data.receitas, totalIncomeDistribution)}
              businessPercent={percentOfTotal(businessIncome, totalIncomeDistribution)}
            />
            <Distribution
              label="Distribuição de despesas"
              personalAmount={data.despesas}
              businessAmount={businessExpense}
              personalPercent={percentOfTotal(data.despesas, totalExpenseDistribution)}
              businessPercent={percentOfTotal(businessExpense, totalExpenseDistribution)}
              danger
            />
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={Landmark} title="Meus bancos" subtitle="Cadastre seus bancos para ter uma visão unificada" />
            <div className="mt-6 flex justify-center">
              <Button className="rounded-full bg-[#FF6A00] px-6 font-bold hover:bg-[#e85f00]" onClick={() => navigate("/carteira")}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar banco
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#FF6A00]/20 bg-white p-6 shadow-sm">
            <SectionTitle icon={Target} title="Reserva de emergência" subtitle="Configure seus custos fixos" />
            <p className="my-9 text-sm text-slate-500">Cadastre seus custos fixos para calcular a meta.</p>
            <Button variant="outline" className="h-11 w-full rounded-2xl font-bold" onClick={() => navigate("/metas")}>
              Configurar
            </Button>
          </Card>
        </div>

        <Card className="mb-5 rounded-2xl border-slate-700/40 bg-white p-6 shadow-sm">
          <SectionTitle icon={Wallet} title="Visão consolidada" subtitle="Pessoal + empresarial no mês atual" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SummaryPill label="Receitas" value={data.receitas} tone="orange" />
            <SummaryPill label="Despesas" value={data.despesas} tone="red" />
            <SummaryPill label="Saldo" value={data.saldo} tone="orange" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <div>
              <p className="font-bold text-slate-500">Taxa de poupança</p>
              <p className="text-xs text-slate-500">
                {savingsRate > 0 ? "Você guardou parte do que recebeu." : "Atenção: margem de poupança baixa."}
              </p>
            </div>
            <span className="font-bold text-red-500">{savingsRate.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="mb-5 rounded-2xl border-[#FF6A00]/20 bg-gradient-to-br from-[#FF6A00]/10 to-white p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Indicadores inteligentes</h2>
              <p className="text-sm text-slate-500">Receba insights personalizados sobre sua saúde financeira com análise automática dos seus dados.</p>
              <ul className="mt-3 space-y-1 text-sm font-medium text-slate-500">
                <li>Nível de proteção financeira</li>
                <li>Variação de gastos mensais</li>
                <li>Dependência de renda variável</li>
                <li>Análise automática e personalizada</li>
              </ul>
              <Button className="mt-4 rounded-full bg-[#FF6A00] px-6 font-bold hover:bg-[#e85f00]">
                Fazer upgrade para Pro
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={Calendar} title={`Resumo de ${monthLabel()}`} subtitle="Comparativo com o mês anterior" />
            <div className="mt-5 space-y-4">
              <SummaryRow label="Receitas" value={data.receitas} tone="orange" />
              <SummaryRow label="Despesas" value={data.despesas} tone="red" />
              <SummaryRow label="Saldo do mês" value={data.saldo} tone="orange" />
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="font-bold text-slate-500">Taxa de economia</p>
                <p className="text-xs text-slate-500">Você gastou exatamente o que ganhou</p>
              </div>
              <span className="text-2xl font-bold text-slate-500">{savingsRate.toFixed(0)}%</span>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={LineChart} title="Fluxo de caixa mensal" subtitle="Evolução de receitas e despesas nos últimos meses" />
            <SimpleChart receitas={data.receitas} despesas={data.despesas} />
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={TrendingUp} title="Evolução do saldo" subtitle="Acompanhe como seu saldo evolui ao longo do tempo" />
            <EmptyState text={loadingTransacoes ? "Carregando transações..." : "Nenhuma transação registrada ainda"} />
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={BarChart3} title="Despesas por categoria" subtitle="Distribuição dos seus gastos pessoais" />
            {Object.keys(data.categoryTotals).length ? (
              <div className="mt-6 space-y-3">
                {Object.entries(data.categoryTotals).map(([category, value]) => (
                  <div key={category}>
                    <div className="mb-1 flex justify-between text-sm font-semibold text-slate-600">
                      <span>{category}</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[#FF6A00]" style={{ width: `${Math.min(100, (value / Math.max(data.despesas, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Nenhuma despesa pessoal registrada ainda" />
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const MarketTicker = ({ quotes, isLoading }: { quotes: MarketQuote[]; isLoading: boolean }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number>();
  const resumeTimeoutRef = useRef<number>();
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
  };

  const resumeSoon = (delay = 2500) => {
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, delay);
  };

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || quotes.length < 2) return undefined;

    const tick = () => {
      if (!pausedRef.current && scroller.scrollWidth > scroller.clientWidth) {
        scroller.scrollLeft += 0.45;
        const loopPoint = scroller.scrollWidth / 2;
        if (scroller.scrollLeft >= loopPoint) {
          scroller.scrollLeft -= loopPoint;
        }
      }
      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    };
  }, [quotes.length]);

  if (isLoading && !quotes.length) {
    return (
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-3 overflow-hidden text-xs font-bold text-slate-600 lg:flex-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 w-36 shrink-0 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />
        ))}
      </div>
    );
  }

  const carouselQuotes = quotes.length > 1 ? [...quotes, ...quotes] : quotes;

  return (
    <div className="relative w-full min-w-0 overflow-hidden lg:flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#f5f7fb] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#f5f7fb] to-transparent" />
      <div
        ref={scrollRef}
        className="flex cursor-grab select-none flex-nowrap items-center gap-3 overflow-x-auto scroll-smooth pr-4 text-xs font-bold text-slate-600 active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
        onMouseEnter={pause}
        onMouseLeave={() => resumeSoon(1200)}
        onWheel={() => {
          pause();
          resumeSoon(3000);
        }}
        onPointerDown={(event) => {
          const scroller = scrollRef.current;
          if (!scroller) return;
          pause();
          draggingRef.current = true;
          dragStartXRef.current = event.clientX;
          dragStartScrollRef.current = scroller.scrollLeft;
          scroller.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const scroller = scrollRef.current;
          if (!draggingRef.current || !scroller) return;
          scroller.scrollLeft = dragStartScrollRef.current - (event.clientX - dragStartXRef.current);
        }}
        onPointerUp={(event) => {
          const scroller = scrollRef.current;
          draggingRef.current = false;
          scroller?.releasePointerCapture(event.pointerId);
          resumeSoon(3000);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          resumeSoon(3000);
        }}
      >
        {carouselQuotes.map((quote, index) => {
          const positive = (quote.changePercent || 0) >= 0;
          return (
            <div
              key={`${quote.symbol}-${index}`}
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200"
            >
              <span className="mr-2 text-[10px] text-slate-400">{quote.label}</span>
              {formatMarketValue(quote)}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                  positive ? "bg-[#FF6A00]/10 text-[#FF6A00]" : "bg-red-50 text-red-500"
                }`}
              >
                {formatMarketChange(quote.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) => (
  <div>
    <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
      <Icon className="h-5 w-5 text-[#FF6A00]" />
      {title}
    </h2>
    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
  </div>
);

const MiniMetric = ({ title, value, icon: Icon, tone }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: "orange" | "red" | "navy" }) => {
  const colors = {
    orange: "border-l-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]",
    red: "border-l-red-500 bg-red-50 text-red-500",
    navy: "border-l-[#0D1B2A] bg-[#0D1B2A]/5 text-[#0D1B2A]",
  };
  return (
    <Card className={`rounded-2xl border-l-4 border-slate-200 p-5 shadow-sm ${colors[tone]}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <p className="mt-3 text-2xl font-bold">{formatCurrency(value)}</p>
    </Card>
  );
};

const Distribution = ({
  label,
  personalAmount,
  businessAmount,
  personalPercent,
  businessPercent,
  danger = false,
}: {
  label: string;
  personalAmount: number;
  businessAmount: number;
  personalPercent: number;
  businessPercent: number;
  danger?: boolean;
}) => {
  const hasValues = personalAmount + businessAmount > 0;
  const personalLabel = `${Math.round(personalPercent)}%`;
  const businessLabel = `${Math.round(businessPercent)}%`;

  return (
    <div className="mt-5">
      <p className={`mb-2 text-sm font-semibold ${danger ? "text-red-500" : "text-[#FF6A00]"}`}>{label}</p>
      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`${danger ? "bg-red-500" : "bg-[#FF6A00]"} text-center text-[10px] font-bold text-white transition-all`}
          style={{ width: `${personalPercent}%` }}
        >
          {personalPercent >= 12 ? personalLabel : ""}
        </div>
        <div
          className="bg-[#0D1B2A]/50 text-center text-[10px] font-bold text-white transition-all"
          style={{ width: `${businessPercent}%` }}
        >
          {businessPercent >= 12 ? businessLabel : ""}
        </div>
        {!hasValues ? (
          <div className="flex flex-1 items-center justify-center text-[10px] font-bold text-slate-400">0%</div>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
        <span>Pessoal: {formatCurrency(personalAmount)} {personalPercent > 0 && personalPercent < 12 ? `(${personalLabel})` : ""}</span>
        <span>Empresarial: {formatCurrency(businessAmount)} {businessPercent > 0 && businessPercent < 12 ? `(${businessLabel})` : ""}</span>
      </div>
    </div>
  );
};

const SummaryPill = ({ label, value, tone }: { label: string; value: number; tone: "orange" | "red" }) => (
  <div className={`rounded-2xl p-4 text-center ${tone === "red" ? "bg-red-50 text-red-500" : "bg-[#FF6A00]/10 text-[#FF6A00]"}`}>
    <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
    <p className="mt-1 font-bold">{formatCurrency(value)}</p>
  </div>
);

const SummaryRow = ({ label, value, tone }: { label: string; value: number; tone: "orange" | "red" }) => (
  <div className={`flex items-center justify-between rounded-2xl border p-4 ${tone === "red" ? "border-red-100 bg-red-50 text-red-500" : "border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00]"}`}>
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="text-xl font-bold">{formatCurrency(value)}</p>
    </div>
    <span className="text-sm font-bold text-slate-500">0.0%</span>
  </div>
);

const SimpleChart = ({ receitas, despesas }: { receitas: number; despesas: number }) => {
  const max = Math.max(receitas, despesas, 1);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  return (
    <div className="mt-8 h-64">
      <div className="flex h-52 items-end gap-5 border-b border-l border-slate-200 px-5">
        {months.map((month, index) => {
          const receitaHeight = index === months.length - 1 ? (receitas / max) * 150 : 8;
          const despesaHeight = index === months.length - 1 ? (despesas / max) * 150 : 8;
          return (
            <div key={month} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div className="flex items-end gap-1">
                <span className="w-3 rounded-t bg-[#FF6A00]" style={{ height: `${Math.max(8, receitaHeight)}px` }} />
                <span className="w-3 rounded-t bg-red-500" style={{ height: `${Math.max(8, despesaHeight)}px` }} />
              </div>
              <span className="text-xs text-slate-500">{month}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-5 text-sm font-bold">
        <span className="text-[#FF6A00]">■ Receitas</span>
        <span className="text-red-500">■ Despesas</span>
      </div>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex min-h-64 items-center justify-center text-center text-sm font-medium text-slate-400">{text}</div>
);

export default Dashboard;
