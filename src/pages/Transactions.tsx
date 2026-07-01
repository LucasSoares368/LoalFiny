import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  User,
  Building2,
  Banknote,
  CreditCard,
  ShieldCheck,
  ShieldOff,
  ReceiptText,
  Landmark,
} from "lucide-react";
import pixIcon from "@/assets/pix-icon.png";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { useBanks } from "@/hooks/useBanks";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { TransactionsList } from "@/components/TransactionsList";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  profile_type?: "personal" | "business" | null;
}

const getToday = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatBalance = (value: unknown) =>
  Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const initialProfile = (searchParams.get("profile") as FinancialProfile) || "personal";

  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const { canUseBusinessProfile } = useUserPlan();
  const { banks, loadBanks, loadAllBanks } = useBanks(currentProfile);
  const [formData, setFormData] = useState({
    amount: 0,
    type: "expense" as "income" | "expense",
    categoryId: "",
    description: "",
    date: getToday(),
    time: getCurrentTime(),
    paymentMethod: "pix",
    bankId: "",
    isEssential: null as boolean | null,
  });

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => !category.profile_type || category.profile_type === currentProfile);
  }, [categories, currentProfile]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      categoryId: visibleCategories.some((category) => category.id === prev.categoryId)
        ? prev.categoryId
        : visibleCategories[0]?.id || "",
      paymentMethod: "pix",
      bankId: "",
      isEssential: prev.type === "income" ? null : prev.isEssential,
    }));
  }, [currentProfile, visibleCategories]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories((data as Category[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias: " + error.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    const selectedCategory = visibleCategories.find((category) => category.id === formData.categoryId);
    const isNaoSeiCategory = normalizeText(selectedCategory?.name || "") === "nao sei";

    if (formData.type === "expense" && formData.isEssential === null && !isNaoSeiCategory) {
      toast.error("Marque se a transação é essencial ou não essencial");
      return;
    }

    if (!formData.bankId) {
      toast.error("Selecione o banco ou cartão da transação");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const selectedBankId = formData.bankId;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount,
        type: formData.type,
        category_id: formData.categoryId || null,
        description: formData.description.trim() || null,
        date: formData.date,
        transaction_time: formData.time || null,
        profile_type: currentProfile,
        bank_id: selectedBankId,
        payment_method: formData.paymentMethod,
        is_essential: formData.type === "expense" ? formData.isEssential : null,
      });

      if (error) throw error;

      if (selectedBankId) {
        const selectedBank = banks.find((bank) => bank.id === selectedBankId);
        if (selectedBank) {
          const currentBalance = Number(selectedBank.current_balance || 0);
          const balanceChange = formData.type === "income" ? amount : -amount;

          const { error: bankError } = await supabase
            .from("banks")
            .update({ current_balance: currentBalance + balanceChange })
            .eq("id", selectedBankId);

          if (bankError) throw bankError;
        }
      }

      const profileLabel = currentProfile === "personal" ? "pessoal" : "empresarial";
      toast.success(`Transação ${profileLabel} registrada com sucesso!`);

      await Promise.all([loadBanks(), loadAllBanks()]);
      setListVersion((version) => version + 1);

      setFormData({
        amount: 0,
        type: "expense",
        categoryId: visibleCategories[0]?.id || "",
        description: "",
        date: getToday(),
        time: getCurrentTime(),
        paymentMethod: "pix",
        bankId: "",
        isEssential: null,
      });
    } catch (error: any) {
      toast.error("Erro ao registrar transação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profile: FinancialProfile) => {
    if (profile === "business" && !canUseBusinessProfile()) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentProfile(profile);
  };

  const isPersonal = currentProfile === "personal";
  const selectedTone = isPersonal ? "text-primary bg-primary/10" : "text-secondary bg-secondary/10";

  return (
    <AppLayout
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={handleProfileChange}
      title="Transações"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-4 ${selectedTone}`}>
              {isPersonal ? <User className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Nova Transação {isPersonal ? "Pessoal" : "Empresarial"}</h1>
              <p className="text-lg text-muted-foreground">
                Registre entradas, saídas e atualize saldos automaticamente
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Dados da transação</CardTitle>
                <CardDescription>Preencha os campos principais para registrar a movimentação</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-4">
                <Label>Tipo *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.type === "income" ? "default" : "outline"}
                    className={formData.type === "income" ? "h-12 bg-success hover:bg-success/90" : "h-12"}
                    onClick={() => setFormData({ ...formData, type: "income", isEssential: null })}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "expense" ? "default" : "outline"}
                    className={formData.type === "expense" ? "h-12 bg-danger hover:bg-danger/90" : "h-12"}
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Despesa
                  </Button>
                </div>
              </div>

              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <CurrencyInput
                  id="amount"
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  className="h-12 text-lg font-semibold"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {formData.type === "expense" && (
                <div className="space-y-2 lg:col-span-4">
                  <Label>Essencialidade *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={formData.isEssential === true ? "default" : "outline"}
                      className={formData.isEssential === true ? "h-12 bg-info hover:bg-info/90" : "h-12"}
                      onClick={() => setFormData({ ...formData, isEssential: true })}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Essencial
                    </Button>
                    <Button
                      type="button"
                      variant={formData.isEssential === false ? "default" : "outline"}
                      className={formData.isEssential === false ? "h-12 bg-warning hover:bg-warning/90" : "h-12"}
                      onClick={() => setFormData({ ...formData, isEssential: false })}
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Não Essencial
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="category">Categoria</Label>
                {categoriesLoading ? (
                  <div className="flex h-12 items-center rounded-md border bg-background px-3 text-sm text-muted-foreground">
                    Carregando categorias...
                  </div>
                ) : (
                  <Select
                    value={formData.categoryId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="bank">Banco/Cartão *</Label>
                <Select
                  value={formData.bankId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, bankId: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione uma conta ou cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.filter((bank) => bank.is_active).map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        <div className="flex items-center gap-2">
                          {bank.account_type === "credit_card" ? (
                            <CreditCard className="h-4 w-4" style={{ color: bank.color }} />
                          ) : (
                            <Landmark className="h-4 w-4" style={{ color: bank.color }} />
                          )}
                          <span>{bank.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {bank.account_type === "credit_card" ? "Cartão" : "Banco"}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            R$ {formatBalance(bank.current_balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="payment_method">Meio de pagamento *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o meio de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <img src={pixIcon} alt="Pix" className="h-4 w-4" />
                        Pix
                      </div>
                    </SelectItem>
                    <SelectItem value="debit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Crédito
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        Transferência
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-8">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes sobre a transação..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex items-end lg:col-span-4">
                <Button
                  type="submit"
                  className={`h-12 w-full rounded-2xl text-base font-bold ${
                    isPersonal ? "bg-gradient-to-r from-primary to-primary-glow" : "bg-gradient-to-r from-secondary to-info"
                  } hover:opacity-90`}
                  disabled={loading || categoriesLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Transação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Últimas transações</CardTitle>
            <CardDescription>Confira e edite os lançamentos do perfil selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsList key={`${currentProfile}-${listVersion}`} profileType={currentProfile} />
          </CardContent>
        </Card>
      </div>

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

export default Transactions;
