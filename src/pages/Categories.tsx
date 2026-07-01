import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Building2,
  Edit3,
  FolderKanban,
  Layers3,
  ListChecks,
  Loader2,
  Palette,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";

type CategoryProfile = "personal" | "business" | null;

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
  profile_type?: CategoryProfile;
}

interface TransactionRef {
  id: string;
  category_id: string | null;
}

const iconSuggestions = ["💰", "💳", "🏦", "📈", "🏠", "🚗", "🍽️", "🛒", "🩺", "🎮", "📚", "💼", "💸", "📦"];
const colorSuggestions = ["#ff6a00", "#0d1b2a", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b"];

const defaultCategoryTemplates = [
  { name: "Mercado", icon: "🛒", color: "#22c55e" },
  { name: "Transporte", icon: "🚗", color: "#3b82f6" },
  { name: "Saúde", icon: "🩺", color: "#ec4899" },
  { name: "Alimentação", icon: "🍽️", color: "#14b8a6" },
  { name: "Moradia", icon: "🏠", color: "#8b5cf6" },
  { name: "Salário", icon: "💼", color: "#10b981" },
  { name: "Pix", icon: "💸", color: "#06b6d4" },
  { name: "Transferência", icon: "↔️", color: "#f97316" },
  { name: "Pagamento", icon: "💳", color: "#ef4444" },
  { name: "Lazer", icon: "🎮", color: "#a855f7" },
  { name: "Educação", icon: "📚", color: "#2563eb" },
  { name: "Outros", icon: "📦", color: "#6b7280" },
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

const safeColor = (color?: string | null) => (color && isHexColor(color) ? color : "#ff6a00");

const profileLabel = (profile: CategoryProfile) => {
  if (profile === "business") return "Empresarial";
  return "Pessoal";
};

const Categories = () => {
  const navigate = useNavigate();
  const { canUseBusinessProfile } = useUserPlan();
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionRef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "📦", color: "#ff6a00" });

  const isPersonal = currentProfile === "personal";

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => !category.profile_type || category.profile_type === currentProfile);
  }, [categories, currentProfile]);

  const usageByCategory = useMemo(() => {
    return transactions.reduce<Record<string, number>>((acc, transaction) => {
      if (transaction.category_id) {
        acc[transaction.category_id] = (acc[transaction.category_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [transactions]);

  const filteredCategories = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query) return visibleCategories;
    return visibleCategories.filter((category) => normalizeText(category.name || "").includes(query));
  }, [searchQuery, visibleCategories]);

  const usedCategories = visibleCategories.filter((category) => (usageByCategory[category.id] || 0) > 0).length;
  const unusedCategories = Math.max(visibleCategories.length - usedCategories, 0);

  const loadData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const [categoriesResult, transactionsResult] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", user.id).order("name"),
        supabase
          .from("transactions")
          .select("id, category_id")
          .eq("user_id", user.id)
          .eq("profile_type", currentProfile),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setCategories((categoriesResult.data as Category[]) || []);
      setTransactions((transactionsResult.data as TransactionRef[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias: " + (error.message || "tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: "", icon: "📦", color: "#ff6a00" });
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      icon: category.icon || "📦",
      color: safeColor(category.color),
    });
    setIsDialogOpen(true);
  };

  const handleProfileChange = (profile: FinancialProfile) => {
    if (profile === "business" && !canUseBusinessProfile()) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentProfile(profile);
    setSearchQuery("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();
    const icon = formData.icon.trim() || "📦";
    const color = formData.color.trim();

    if (name.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (!isHexColor(color)) {
      toast.error("Informe uma cor válida no formato #ff6a00.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não encontrado");

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({ name, icon, color })
          .eq("id", editingCategory.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("categories").insert({
          user_id: user.id,
          name,
          icon,
          color,
          profile_type: currentProfile,
          is_default: false,
        });

        if (error) throw error;
        toast.success("Categoria criada com sucesso!");
      }

      handleDialogOpenChange(false);
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar categoria: " + (error.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não encontrado");

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Categoria excluída com sucesso!");
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao excluir categoria: " + (error.message || "tente novamente"));
    } finally {
      setCategoryToDelete(null);
    }
  };

  const createDefaultCategories = async () => {
    setCreatingDefaults(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não encontrado");

      const existingNames = new Set(visibleCategories.map((category) => normalizeText(category.name || "")));
      const toCreate = defaultCategoryTemplates.filter((category) => !existingNames.has(normalizeText(category.name)));

      if (toCreate.length === 0) {
        toast.info("As categorias padrão já existem para este perfil.");
        return;
      }

      const { error } = await supabase.from("categories").insert(
        toCreate.map((category) => ({
          ...category,
          user_id: user.id,
          profile_type: currentProfile,
          is_default: true,
        })),
      );

      if (error) throw error;
      toast.success(`${toCreate.length} categorias padrão criadas!`);
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao criar categorias padrão: " + (error.message || "tente novamente"));
    } finally {
      setCreatingDefaults(false);
    }
  };

  return (
    <AppLayout
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={handleProfileChange}
      title="Categorias"
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-4 ${isPersonal ? "bg-primary/10" : "bg-secondary/10"}`}>
              {isPersonal ? (
                <User className="h-7 w-7 text-primary" />
              ) : (
                <Building2 className="h-7 w-7 text-secondary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Categorias {isPersonal ? "Pessoais" : "Empresariais"}</h1>
              <p className="text-lg text-muted-foreground">
                Organize receitas, despesas e relatórios por tipo de movimentação
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={createDefaultCategories}
              disabled={creatingDefaults || loading}
              className="h-12 shrink-0 rounded-2xl px-6 text-base font-bold"
            >
              {creatingDefaults ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Categorias Padrão
            </Button>
            <Button onClick={handleOpenDialog} className="h-12 shrink-0 rounded-2xl px-8 text-base font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={FolderKanban} label="Categorias" value={visibleCategories.length} description="Cadastradas" />
            <MetricCard icon={ListChecks} label="Em uso" value={usedCategories} description="Com transações" />
            <MetricCard icon={Layers3} label="Sem uso" value={unusedCategories} description="Disponíveis para organizar" />
            <MetricCard icon={isPersonal ? User : Building2} label="Perfil" value={profileLabel(currentProfile)} description="Visualização atual" />
          </div>
        )}

        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-14 rounded-2xl pl-12 text-base"
          />
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <FolderKanban className="mb-5 h-20 w-20 text-muted-foreground/35" />
            <h3 className="mb-3 text-2xl font-bold">
              {searchQuery ? "Nenhuma categoria encontrada" : `Nenhuma categoria ${isPersonal ? "pessoal" : "empresarial"} cadastrada`}
            </h3>
            <p className="mb-6 max-w-xl text-lg text-muted-foreground">
              {searchQuery
                ? "Tente buscar com outros termos ou limpe o campo de busca."
                : `Crie categorias para organizar as movimentações do perfil ${isPersonal ? "pessoal" : "empresarial"}.`}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenDialog} className="h-12 rounded-2xl px-8 text-base font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => {
              const color = safeColor(category.color);
              const usageCount = usageByCategory[category.id] || 0;

              return (
                <Card key={category.id} className="rounded-2xl border-border/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {category.icon || "📦"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-bold">{category.name}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {profileLabel(category.profile_type || currentProfile)}
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {category.is_default ? "Padrão" : "Personalizada"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => handleEdit(category)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setCategoryToDelete(category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Transações vinculadas</span>
                      <span className="text-lg font-bold">{usageCount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize o nome, ícone e cor da categoria."
                : `Crie uma categoria para o perfil ${isPersonal ? "pessoal" : "empresarial"}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nome da Categoria *</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ex: Transporte, Lazer, Mercado"
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-icon">Ícone</Label>
                <Input
                  id="category-icon"
                  value={formData.icon}
                  onChange={(event) => setFormData((prev) => ({ ...prev, icon: event.target.value.slice(0, 4) }))}
                  className="h-12 rounded-2xl text-center text-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Ícones rápidos</Label>
              <div className="flex flex-wrap gap-2">
                {iconSuggestions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-card text-xl transition hover:border-primary hover:bg-primary/10"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Cor da categoria
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colorSuggestions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Selecionar cor ${color}`}
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      className="h-10 w-10 rounded-full border-4 transition hover:scale-105"
                      style={{
                        backgroundColor: color,
                        borderColor: formData.color === color ? "#0d1b2a" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Código</Label>
                <Input
                  id="category-color"
                  value={formData.color}
                  onChange={(event) => setFormData((prev) => ({ ...prev, color: event.target.value }))}
                  placeholder="#ff6a00"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-4">
              <Label className="mb-3 block">Prévia</Label>
              <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${safeColor(formData.color)}18`, color: safeColor(formData.color) }}
                >
                  {formData.icon || "📦"}
                </div>
                <div>
                  <p className="text-lg font-bold">{formData.name || "Nome da categoria"}</p>
                  <p className="text-sm text-muted-foreground">{profileLabel(currentProfile)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-12 rounded-2xl px-8" onClick={() => handleDialogOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="h-12 rounded-2xl px-8 font-bold" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete
                ? `A categoria "${categoryToDelete.name}" será removida. ${
                    (usageByCategory[categoryToDelete.id] || 0) > 0
                      ? `${usageByCategory[categoryToDelete.id]} transação(ões) ficarão sem categoria.`
                      : "Esta ação não pode ser desfeita."
                  }`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradePrompt
        feature="Controle PF/PJ"
        description="O controle separado de perfil Pessoal e Empresarial está disponível no plano Pro Plus."
        variant="modal"
        requiredPlan="pro_plus"
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        benefits={["Controle separado PF e PJ", "Categorias por perfil", "Relatórios segmentados", "Dashboard consolidado"]}
      />
    </AppLayout>
  );
};

interface MetricCardProps {
  icon: typeof FolderKanban;
  label: string;
  value: string | number;
  description: string;
}

const MetricCard = ({ icon: Icon, label, value, description }: MetricCardProps) => (
  <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
    <CardContent className="flex min-h-32 items-center justify-between gap-4 p-6">
      <div>
        <div className="mb-3 flex items-center gap-3 text-muted-foreground">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold">{label}</span>
        </div>
        <p className="text-3xl font-bold text-primary">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Categories;
