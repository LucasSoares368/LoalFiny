import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, TrendingDown, CheckCircle2, Search, WalletCards, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { DebtFormDialog } from "@/components/debts/DebtFormDialog";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtPaymentDialog } from "@/components/debts/DebtPaymentDialog";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";

interface Debt {
  id: string;
  name: string;
  creditor: string | null;
  total_amount: number;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_day: number | null;
  start_date: string | null;
  status: string;
  profile_type: "personal" | "business";
  notes: string | null;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const normalizeDebt = (debt: any): Debt => ({
  ...debt,
  total_amount: toNumber(debt.total_amount),
  current_balance: toNumber(debt.current_balance),
  interest_rate: debt.interest_rate === null || debt.interest_rate === undefined ? null : toNumber(debt.interest_rate),
  minimum_payment: debt.minimum_payment === null || debt.minimum_payment === undefined ? null : toNumber(debt.minimum_payment),
  due_day: debt.due_day === null || debt.due_day === undefined ? null : Number(debt.due_day),
});

function DebtKpi({
  title,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof CreditCard;
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
          <p className={`text-3xl font-bold ${tone === "danger" ? "text-red-500" : tone === "success" ? "text-emerald-600" : "text-foreground"}`}>
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

const Debts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canUseBusinessProfile } = useUserPlan();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };

    checkAuth();
  }, [navigate]);

  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .eq("profile_type", currentProfile)
        .order("status", { ascending: true })
        .order("current_balance", { ascending: false });

      if (error) throw error;
      setDebts((data || []).map(normalizeDebt));
    } catch (error: any) {
      toast.error("Erro ao carregar dívidas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja remover esta dívida?")) return;

    try {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Dívida removida!");
      loadDebts();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const filteredDebts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return debts;

    return debts.filter((debt) =>
      [debt.name, debt.creditor, debt.notes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [debts, searchQuery]);

  const activeDebts = filteredDebts.filter((debt) => debt.status === "active");
  const paidDebts = filteredDebts.filter((debt) => debt.status === "paid");
  const allActiveDebts = debts.filter((debt) => debt.status === "active");

  const totalDebt = allActiveDebts.reduce((sum, debt) => sum + debt.current_balance, 0);
  const originalTotal = debts.reduce((sum, debt) => sum + debt.total_amount, 0);
  const totalPaid = debts.reduce((sum, debt) => sum + Math.max(debt.total_amount - debt.current_balance, 0), 0);
  const minimumPayments = allActiveDebts.reduce((sum, debt) => sum + (debt.minimum_payment || 0), 0);
  const averageProgress = originalTotal > 0 ? (totalPaid / originalTotal) * 100 : 0;

  const openCreateDialog = () => {
    setEditingDebt(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDebt(null);
  };

  return (
    <AppLayout
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={(profile) => {
        if (profile === "business" && !canUseBusinessProfile()) {
          setShowUpgradeModal(true);
          return;
        }
        setCurrentProfile(profile);
      }}
      title="Dívidas"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Dívidas</h1>
              <p className="text-lg text-muted-foreground">Controle parcelas, saldos e pagamentos pendentes</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="h-12 rounded-2xl px-8 text-base font-bold">
            <Plus className="mr-2 h-5 w-5" />
            Nova Dívida
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DebtKpi
            title="Saldo Devedor"
            value={formatCurrency(totalDebt)}
            description={`${allActiveDebts.length} dívida${allActiveDebts.length === 1 ? "" : "s"} ativa${allActiveDebts.length === 1 ? "" : "s"}`}
            icon={CreditCard}
            tone="danger"
          />
          <DebtKpi
            title="Total Pago"
            value={formatCurrency(totalPaid)}
            description={`${averageProgress.toFixed(1)}% do valor original`}
            icon={TrendingDown}
            tone="success"
          />
          <DebtKpi
            title="Pagamento Mínimo"
            value={formatCurrency(minimumPayments)}
            description="Compromisso mensal estimado"
            icon={CalendarClock}
            tone="primary"
          />
          <DebtKpi
            title="Dívidas Quitadas"
            value={String(debts.filter((debt) => debt.status === "paid").length)}
            description="Registros finalizados"
            icon={CheckCircle2}
            tone="success"
          />
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar dívidas..."
            className="h-14 rounded-2xl border-border/80 bg-card pl-14 text-base shadow-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : debts.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 text-center">
            <WalletCards className="mb-5 h-16 w-16 text-muted-foreground/60" />
            <h2 className="text-2xl font-bold text-foreground">Nenhuma dívida cadastrada</h2>
            <p className="mt-2 max-w-md text-lg text-muted-foreground">
              Comece cadastrando financiamentos, empréstimos ou cartões para acompanhar o saldo devedor.
            </p>
            <Button onClick={openCreateDialog} className="mt-6 h-12 rounded-2xl px-8 text-base font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Cadastrar Primeira Dívida
            </Button>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-card px-6 text-center shadow-sm">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/60" />
            <h2 className="text-xl font-bold text-foreground">Nenhuma dívida encontrada</h2>
            <p className="mt-2 text-muted-foreground">Tente buscar por outro nome, credor ou observação.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeDebts.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Dívidas Ativas</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {activeDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onEdit={(selectedDebt) => {
                        setEditingDebt(selectedDebt);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDelete}
                      onPayment={setPaymentDebt}
                    />
                  ))}
                </div>
              </section>
            )}

            {paidDebts.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Dívidas Quitadas</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {paidDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onEdit={(selectedDebt) => {
                        setEditingDebt(selectedDebt);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDelete}
                      onPayment={setPaymentDebt}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <DebtFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
          else setIsFormOpen(true);
        }}
        debt={editingDebt}
        profileType={currentProfile}
        onSuccess={() => {
          handleFormClose();
          loadDebts();
        }}
      />

      <DebtPaymentDialog
        debt={paymentDebt}
        onClose={() => setPaymentDebt(null)}
        onSuccess={() => {
          setPaymentDebt(null);
          loadDebts();
        }}
      />

      <UpgradePrompt
        feature="Controle PF/PJ"
        description="O controle separado de perfil Pessoal e Empresarial está disponível no plano Pro Plus."
        variant="modal"
        requiredPlan="pro_plus"
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        benefits={["Controle separado PF e PJ", "Caixa empresarial", "Relatório de rentabilidade", "Dashboard avançado consolidado"]}
      />
    </AppLayout>
  );
};

export default Debts;
