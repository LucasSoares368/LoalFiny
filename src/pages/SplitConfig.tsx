import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  BookMarked,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  Copy,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  Percent,
  PiggyBank,
  Plane,
  Plus,
  Save,
  Shield,
  ShoppingBag,
  Star,
  StarOff,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSplitRules, SplitRule } from "@/hooks/useSplitRules";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SplitCategory {
  id: string;
  name: string;
  percentage: number;
  icon: string;
}

const AVAILABLE_ICONS = [
  { key: "wallet", icon: Wallet, label: "Carteira", color: "text-emerald-500" },
  { key: "shield", icon: Shield, label: "Escudo", color: "text-blue-500" },
  { key: "building", icon: Building2, label: "Empresa", color: "text-purple-500" },
  { key: "briefcase", icon: Briefcase, label: "Trabalho", color: "text-amber-500" },
  { key: "piggybank", icon: PiggyBank, label: "Poupança", color: "text-pink-500" },
  { key: "heart", icon: Heart, label: "Saúde", color: "text-red-500" },
  { key: "home", icon: Home, label: "Casa", color: "text-cyan-500" },
  { key: "car", icon: Car, label: "Veículo", color: "text-orange-500" },
  { key: "graduation", icon: GraduationCap, label: "Educação", color: "text-indigo-500" },
  { key: "plane", icon: Plane, label: "Viagem", color: "text-teal-500" },
  { key: "shopping", icon: ShoppingBag, label: "Compras", color: "text-rose-500" },
  { key: "percent", icon: Percent, label: "Geral", color: "text-sky-500" },
];

const DEFAULT_CATEGORIES: SplitCategory[] = [
  { id: "1", name: "Pessoal", percentage: 45, icon: "wallet" },
  { id: "2", name: "Reserva", percentage: 45, icon: "shield" },
  { id: "3", name: "Empresa", percentage: 10, icon: "building" },
];

const getIconData = (key: string) => AVAILABLE_ICONS.find((item) => item.key === key) || AVAILABLE_ICONS[0];
const fmt = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const SplitConfig = () => {
  const { rules, loading: rulesLoading, saveRule, updateRule, deleteRule } = useSplitRules();
  const { canUseSplit, loading: planLoading } = useUserPlan();

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [categories, setCategories] = useState<SplitCategory[]>(DEFAULT_CATEGORIES);
  const [calculated, setCalculated] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  const total = categories.reduce((sum, category) => sum + category.percentage, 0);
  const isValid = total === 100;

  const parsedAmount = useMemo(() => {
    const value = amount.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amount]);

  const results = useMemo(() => {
    if (parsedAmount <= 0 || !isValid) return null;

    let remaining = parsedAmount;
    return categories.map((category, index) => {
      const isLast = index === categories.length - 1;
      const value = isLast
        ? Math.round(remaining * 100) / 100
        : Math.floor((parsedAmount * category.percentage) / 100 * 100) / 100;

      if (!isLast) remaining -= value;
      return { ...category, value };
    });
  }, [categories, isValid, parsedAmount]);

  const updatePercentage = (id: string, value: number) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, percentage: Math.max(0, Math.min(100, value)) } : category,
      ),
    );
    setCalculated(false);
  };

  const updateCategoryName = (id: string, name: string) => {
    setCategories((prev) => prev.map((category) => (category.id === id ? { ...category, name } : category)));
  };

  const updateCategoryIcon = (id: string, icon: string) => {
    setCategories((prev) => prev.map((category) => (category.id === id ? { ...category, icon } : category)));
  };

  const addCategory = () => {
    setCategories((prev) => [...prev, { id: String(Date.now()), name: "Nova categoria", percentage: 0, icon: "percent" }]);
    setCalculated(false);
  };

  const removeCategory = (id: string) => {
    if (categories.length <= 2) {
      toast.error("Mínimo de 2 categorias");
      return;
    }

    setCategories((prev) => prev.filter((category) => category.id !== id));
    setCalculated(false);
  };

  const handleCalculate = () => {
    if (parsedAmount <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (!isValid) {
      toast.error("A soma dos percentuais deve ser 100%");
      return;
    }

    setCalculated(true);
  };

  const handleCopyResults = () => {
    if (!results) return;

    const text = [
      `Divisão de R$ ${fmt(parsedAmount)}`,
      source ? `Fonte: ${source}` : "",
      "",
      ...results.map((result) => `${result.name} (${result.percentage}%): R$ ${fmt(result.value)}`),
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Resultado copiado");
  };

  const loadSavedRule = (rule: SplitRule) => {
    setCategories([
      { id: "1", name: "Pessoal", percentage: Number(rule.personal_percentage), icon: "wallet" },
      { id: "2", name: "Reserva", percentage: Number(rule.reserve_percentage), icon: "shield" },
      { id: "3", name: "Empresa", percentage: Number(rule.business_percentage), icon: "building" },
    ]);
    setCalculated(false);
    toast.success(`Regra "${rule.name}" carregada`);
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      toast.error("Insira um nome para a regra");
      return;
    }

    if (!isValid) {
      toast.error("A soma deve ser 100%");
      return;
    }

    setSavingRule(true);
    try {
      await saveRule({
        name: ruleName.trim(),
        personal_percentage: categories[0]?.percentage || 0,
        reserve_percentage: categories[1]?.percentage || 0,
        business_percentage: categories[2]?.percentage || 0,
        is_active: false,
      });
      toast.success("Regra salva");
      setSaveDialogOpen(false);
      setRuleName("");
    } catch {
      toast.error("Erro ao salvar regra");
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule(id);
      toast.success("Regra excluída");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleToggleFavorite = async (rule: SplitRule) => {
    try {
      await updateRule(rule.id, { is_active: !rule.is_active });
      toast.success(rule.is_active ? "Removida dos favoritos" : "Marcada como favorita");
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const cardClass = "rounded-2xl border-border/80 bg-card shadow-sm";

  if (planLoading) {
    return (
      <AppLayout title="Divisão Automática">
        <div className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!canUseSplit()) {
    return (
      <AppLayout title="Divisão Automática">
        <div className="mx-auto max-w-2xl">
          <UpgradePrompt
            feature="Divisão Automática"
            description="Calcule divisões de receita por percentual e salve regras personalizadas."
            requiredPlan="pro"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Divisão Automática">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Percent className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">Divisão Automática</h1>
              <p className="mt-1 max-w-2xl text-lg text-muted-foreground">
                Distribua receitas entre áreas, simule valores e salve regras para usar novamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Soma atual</p>
              <p className={isValid ? "text-xl font-bold text-primary" : "text-xl font-bold text-destructive"}>{total}%</p>
            </div>
          </div>
        </div>

        {rules.length > 0 || rulesLoading ? (
          <Card className={cardClass}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Regras salvas</CardTitle>
                  <CardDescription>Clique em uma regra para carregar os percentuais.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando regras...
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(rule)}
                          className="mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-primary"
                          title={rule.is_active ? "Remover favorito" : "Favoritar regra"}
                        >
                          {rule.is_active ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>

                        <button type="button" onClick={() => loadSavedRule(rule)} className="min-w-0 flex-1 text-left">
                          <p className="truncate font-bold text-foreground">{rule.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {Number(rule.personal_percentage)}% Pessoal · {Number(rule.reserve_percentage)}% Reserva ·{" "}
                            {Number(rule.business_percentage)}% Empresa
                          </p>
                        </button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="text-xl">Dados da receita</CardTitle>
                <CardDescription>Informe o valor que será distribuído.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor recebido (R$)</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(event) => {
                      const value = event.target.value.replace(".", ",");
                      if (/^-?\d*,?\d{0,2}$/.test(value) || value === "") {
                        setAmount(value);
                        setCalculated(false);
                      }
                    }}
                    className="h-12 rounded-2xl text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Fonte / origem</Label>
                  <Input
                    id="source"
                    placeholder='Ex: "CLT", "Freelance", "Ganho pessoal"'
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <Button className="h-12 w-full rounded-2xl text-base font-bold" onClick={handleCalculate} disabled={!isValid || parsedAmount <= 0}>
                  Calcular divisão
                </Button>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">Regra de divisão</CardTitle>
                    <CardDescription>A soma dos percentuais deve fechar em 100%.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => {
                      setRuleName("");
                      setSaveDialogOpen(true);
                    }}
                    disabled={!isValid}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar regra
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {categories.map((category) => {
                  const iconData = getIconData(category.icon);
                  const Icon = iconData.icon;

                  return (
                    <div key={category.id} className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background shadow-sm transition-colors hover:bg-primary/10"
                              title="Trocar ícone"
                            >
                              <Icon className={`h-5 w-5 ${iconData.color}`} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto rounded-2xl p-3" align="start">
                            <p className="mb-2 px-1 text-xs text-muted-foreground">Escolha um ícone</p>
                            <div className="grid grid-cols-4 gap-1">
                              {AVAILABLE_ICONS.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                  <button
                                    type="button"
                                    key={item.key}
                                    onClick={() => updateCategoryIcon(category.id, item.key)}
                                    className={`rounded-xl p-2 transition-colors hover:bg-muted ${
                                      category.icon === item.key ? "bg-primary/10 ring-1 ring-primary" : ""
                                    }`}
                                    title={item.label}
                                  >
                                    <ItemIcon className={`h-4 w-4 ${item.color}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Input
                          value={category.name}
                          onChange={(event) => updateCategoryName(category.id, event.target.value)}
                          className="h-11 min-w-0 flex-1 rounded-xl bg-background font-semibold"
                        />

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={category.percentage}
                            onChange={(event) => updatePercentage(category.id, parseInt(event.target.value) || 0)}
                            className="h-11 w-24 rounded-xl text-right font-semibold"
                          />
                          <span className="text-sm font-semibold text-muted-foreground">%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => removeCategory(category.id)}
                            disabled={categories.length <= 2}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Slider className="mt-4" value={[category.percentage]} onValueChange={([value]) => updatePercentage(category.id, value)} max={100} step={1} />
                    </div>
                  );
                })}

                <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={addCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar categoria
                </Button>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    isValid ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {isValid ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
                    Total configurado
                  </span>
                  <Badge variant={isValid ? "default" : "destructive"} className="rounded-full px-3 py-1">
                    {total}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={`${cardClass} xl:sticky xl:top-20 xl:self-start`}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl">Resultado</CardTitle>
                  <CardDescription>{source ? `Fonte: ${source}` : "Simule para visualizar a distribuição."}</CardDescription>
                </div>
                <Button variant="outline" className="h-10 rounded-xl" onClick={handleCopyResults} disabled={!results || !calculated}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl bg-muted/40 p-5">
                <p className="text-sm font-semibold text-muted-foreground">Valor total</p>
                <p className="mt-2 text-3xl font-bold tracking-normal text-foreground">R$ {fmt(parsedAmount)}</p>
              </div>

              {calculated && results ? (
                <div className="grid gap-3">
                  {results.map((result) => {
                    const iconData = getIconData(result.icon);
                    const Icon = iconData.icon;

                    return (
                      <div key={result.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-background p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
                            <Icon className={`h-5 w-5 ${iconData.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground">{result.name}</p>
                            <p className="text-sm text-muted-foreground">{result.percentage}% do valor</p>
                          </div>
                        </div>
                        <p className="shrink-0 text-lg font-bold text-primary">R$ {fmt(result.value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                  <Percent className="h-14 w-14 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-bold text-foreground">Nenhum cálculo realizado</p>
                  <p className="mt-1 max-w-sm text-muted-foreground">Preencha o valor e clique em calcular para ver a divisão automática.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Salvar regra de divisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Nome da regra</Label>
              <Input
                placeholder='Ex: "Divisão CLT", "Freelance 50/30/20"'
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2 rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground">
              {categories.map((category) => {
                const iconData = getIconData(category.icon);
                const Icon = iconData.icon;

                return (
                  <div key={category.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className={`h-4 w-4 ${iconData.color}`} />
                      <span className="truncate">{category.name}</span>
                    </span>
                    <span className="font-semibold text-foreground">{category.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={handleSaveRule} disabled={savingRule || !ruleName.trim()}>
              {savingRule ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SplitConfig;
