import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Edit, Plus, Trash2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmojiPicker } from "@/components/ui/emoji-picker";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

const Categories = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "📦", color: "#16a34a" });

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
          })
          .eq("id", editingCategory.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!");
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            is_default: false,
          });

        if (error) throw error;
        toast.success("Categoria criada com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", icon: "📦", color: "#16a34a" });
      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryToDelete)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Categoria excluída com sucesso!");
      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCategoryToDelete(null);
    }
  };

  const createDefaultCategories = async () => {
    try {
      setCreatingDefaults(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const defaultCategories = [
        { name: "Mercado", icon: "🧺", color: "#22c55e" },
        { name: "Transporte", icon: "🚗", color: "#3b82f6" },
        { name: "Saúde", icon: "🔋", color: "#ec4899" },
        { name: "Alimentação", icon: "🍽️", color: "#14b8a6" },
        { name: "Moradia", icon: "🏠", color: "#8b5cf6" },
        { name: "Salário", icon: "💼", color: "#10b981" },
        { name: "Pix", icon: "💸", color: "#06b6d4" },
        { name: "Transferência", icon: "↔️", color: "#f97316" },
        { name: "Pagamento", icon: "💳", color: "#ef4444" },
        { name: "Outros", icon: "📦", color: "#6b7280" },
      ];

      const existingNames = new Set(categories.map(c => c.name.toLowerCase()));
      const toCreate = defaultCategories.filter(c => !existingNames.has(c.name.toLowerCase()));

      if (toCreate.length === 0) {
        toast.info("As categorias padrão já existem");
        return;
      }

      const { error } = await supabase
        .from("categories")
        .insert(toCreate.map(c => ({
          ...c,
          user_id: user.id,
          is_default: false,
        })));

      if (error) throw error;
      toast.success(`${toCreate.length} categorias padrão criadas!`);
      loadCategories();
    } catch (error: any) {
      toast.error("Erro ao criar categorias padrão");
    } finally {
      setCreatingDefaults(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", icon: "📦", color: "#16a34a" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Categorias">
      <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <span className="truncate">Categorias</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize suas transações
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={createDefaultCategories}
              disabled={creatingDefaults}
              className="shrink-0"
            >
              {creatingDefaults ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              ) : (
                <>
                  <FolderKanban className="mr-1.5 h-4 w-4" />
                  Padrão
                </>
              )}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow shrink-0">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory 
                      ? "Atualize as informações da categoria" 
                      : "Crie uma nova categoria personalizada"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Categoria</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Transporte, Lazer"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Ícone (Emoji)</Label>
                      <EmojiPicker
                        value={formData.icon}
                        onChange={(emoji) => setFormData({ ...formData, icon: emoji })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Cor</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#16a34a"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleDialogClose}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm">
                      {editingCategory ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                Nenhuma categoria criada ainda
              </p>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Criar Primeira
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="text-xl sm:text-2xl w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg shrink-0"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{category.name}</p>
                        {category.is_default && (
                          <span className="text-[10px] text-muted-foreground">Padrão</span>
                        )}
                      </div>
                    </div>
                    {!category.is_default && (
                      <div className="flex shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCategoryToDelete(category.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-danger text-danger-foreground hover:bg-danger/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Categories;