import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  Crown,
  Shield,
  TrendingUp,
  Calendar,
  Clock,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  ShieldOff,
  Trash2,
  Mail,
  Loader2,
  Settings,
  Globe,
  Key,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Bot,
  CreditCard,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RegistrationControl } from "@/components/admin/RegistrationControl";

interface UserWithPlan {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  phone_number: string | null;
  subscription_status: string | null;
  plan_type: string | null;
  plan_name: string | null;
  is_blocked?: boolean;
}

interface DashboardStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  newUsersThisMonth: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    newUsersThisMonth: 0,
  });
  const [plans, setPlans] = useState<{ id: string; name: string; plan_type: string }[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalCount, setPaymentsTotalCount] = useState(0);
  const [paymentsPageSize] = useState(10);
  const [clearingPayments, setClearingPayments] = useState(false);
  const [isClearPaymentsDialogOpen, setIsClearPaymentsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Evolution API Config State
  const [evolutionConfig, setEvolutionConfig] = useState({
    id: "",
    api_url: "",
    api_key: "",
    instance_name: "",
  });

  // OpenAI Config State
  const [openAiConfig, setOpenAiConfig] = useState({
    id: "",
    api_key: "",
    model: "gpt-4o-mini",
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testingOpenAi, setTestingOpenAi] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);

  // Mercado Pago Config State
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    id: "",
    access_token: "",
    public_key: "",
    is_active: true
  });
  const [savingMercadoPago, setSavingMercadoPago] = useState(false);

  const [fullPlans, setFullPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  const formatCentsToBRL = (cents: number) => {
    if (isNaN(cents)) return "0,00";
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Acesso negado. Você não tem permissão para acessar esta página.");
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadPlans();
      loadEvolutionConfig();
      loadOpenAiConfig();
      loadMercadoPagoConfig();
      loadFullPlans();
      loadPayments();
    }
  }, [isAdmin]);

  const loadPayments = async (page: number = 1) => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "get",
          table: "payments",
          data: { page, pageSize: paymentsPageSize }
        }
      });
      if (error) throw error;
      if (data) {
        setPayments(data.data);
        setPaymentsTotalCount(data.count);
        setPaymentsPage(page);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.error("Erro ao carregar histórico de pagamentos");
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update",
          table: "payments",
          data: {
            id: paymentId,
            status: newStatus
          }
        }
      });

      if (error) throw error;
      toast.success("Status do pagamento atualizado!");
      loadPayments(paymentsPage);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status do pagamento");
    }
  };


  const handleClearPayments = async () => {
    setIsClearPaymentsDialogOpen(false);
    setClearingPayments(true);

    setClearingPayments(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "clear_all", table: "payments" }
      });
      if (error) throw error;
      toast.success("Histórico limpo com sucesso!");
      loadPayments(1);
    } catch (error: any) {
      console.error("Error clearing payments:", error);
      toast.error("Erro ao limpar histórico: " + error.message);
    } finally {
      setClearingPayments(false);
    }
  };

  const loadMercadoPagoConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "get", table: "mercado_pago_config" }
      });
      if (error) throw error;
      if (data) setMercadoPagoConfig(data);
    } catch (error) {
      console.error("Error loading Mercado Pago config:", error);
    }
  };

  const handleSaveMercadoPagoConfig = async () => {
    setSavingMercadoPago(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update",
          table: "mercado_pago_config",
          data: {
            id: mercadoPagoConfig.id || undefined,
            access_token: mercadoPagoConfig.access_token,
            public_key: mercadoPagoConfig.public_key,
            is_active: mercadoPagoConfig.is_active
          }
        }
      });

      if (error) throw error;
      toast.success("Configuração do Mercado Pago salva com sucesso!");
      loadMercadoPagoConfig();
    } catch (error: any) {
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSavingMercadoPago(false);
    }
  };

  const loadFullPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "get", table: "plans" }
      });
      if (error) throw error;
      if (data) setFullPlans(data);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleUpdatePlan = async (plan: any) => {
    setSavingPlan(plan.id);
    try {
      // Normalize values to ensure they are integers (cents)
      const price_monthly = typeof plan.price_monthly === 'string'
        ? parseInt(plan.price_monthly.replace(/[^\d]/g, "")) || 0
        : Math.round(plan.price_monthly || 0);

      const price_yearly = typeof plan.price_yearly === 'string'
        ? parseInt(plan.price_yearly.replace(/[^\d]/g, "")) || 0
        : Math.round(plan.price_yearly || 0);

      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update",
          table: "plans",
          data: {
            id: plan.id,
            price_monthly,
            price_yearly
          }
        }
      });

      if (error) throw error;
      toast.success(`Plano ${plan.name} atualizado com sucesso!`);
      loadFullPlans();
    } catch (error: any) {
      toast.error("Erro ao atualizar plano: " + error.message);
    } finally {
      setSavingPlan(null);
    }
  };

  const loadOpenAiConfig = async () => {
    const { data, error } = await supabase
      .from("openai_config")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setOpenAiConfig(data);
    }
  };

  const handleSaveOpenAiConfig = async () => {
    setSavingOpenAi(true);
    try {
      const { error } = await supabase
        .from("openai_config")
        .upsert({
          id: openAiConfig.id || undefined,
          api_key: openAiConfig.api_key,
          model: openAiConfig.model,
        });

      if (error) throw error;
      toast.success("Configuração da OpenAI salva com sucesso!");
      loadOpenAiConfig();
    } catch (error: any) {
      console.error("Error saving OpenAI config:", error);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSavingOpenAi(false);
    }
  };

  const handleTestOpenAiConnection = async () => {
    setTestingOpenAi(true);
    try {
      const { data, error } = await supabase.functions.invoke("openai-config", {
        body: {
          action: "test-connection",
          config: openAiConfig
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || "Conexão estabelecida com sucesso!");
      } else {
        toast.error("Erro na conexão: " + data.error);
      }
    } catch (error: any) {
      console.error("Error testing OpenAI connection:", error);
      toast.error("Erro ao testar conexão: " + error.message);
    } finally {
      setTestingOpenAi(false);
    }
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, planFilter]);

  const loadEvolutionConfig = async () => {
    const { data, error } = await supabase
      .from("evolution_api_config")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setEvolutionConfig(data);
    }
  };

  const handleSaveEvolutionConfig = async () => {
    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from("evolution_api_config")
        .upsert({
          id: evolutionConfig.id || undefined,
          api_url: evolutionConfig.api_url,
          api_key: evolutionConfig.api_key,
          instance_name: evolutionConfig.instance_name,
        });

      if (error) throw error;
      toast.success("Configuração da Evolution API salva com sucesso!");
      loadEvolutionConfig();
    } catch (error: any) {
      console.error("Error saving Evolution config:", error);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestEvolutionConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: {
          action: "test-connection",
          config: evolutionConfig
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Conexão estabelecida com sucesso!");
      } else {
        toast.error("Erro na conexão: " + data.error);
      }
    } catch (error: any) {
      console.error("Error testing connection:", error);
      toast.error("Erro ao testar conexão: " + error.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("id, name, plan_type")
      .eq("is_active", true);

    if (!error && data) {
      setPlans(data);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all subscriptions with plan info
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select(`
          user_id,
          status,
          plans (
            name,
            plan_type
          )
        `);

      if (subsError) throw subsError;

      // Merge data
      const usersWithPlans: UserWithPlan[] = (profiles || []).map((profile) => {
        const subscription = subscriptions?.find(s => s.user_id === profile.id);
        const isActive = subscription?.status === "active";
        
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          phone_number: profile.phone_number,
          is_blocked: profile.is_blocked || false,
          subscription_status: subscription?.status || null,
          // Only show the plan if it's active, otherwise default to free
          plan_type: isActive ? (subscription?.plans?.plan_type || "free") : "free",
          plan_name: isActive ? (subscription?.plans?.name || "Gratuito") : "Gratuito",
        };
      });

      setUsers(usersWithPlans);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const proCount = usersWithPlans.filter(u =>
        u.subscription_status === "active" && u.plan_type !== "free"
      ).length;

      const newThisMonth = usersWithPlans.filter(u =>
        u.created_at && new Date(u.created_at) >= startOfMonth
      ).length;

      setStats({
        totalUsers: usersWithPlans.length,
        proUsers: proCount,
        freeUsers: usersWithPlans.length - proCount,
        newUsersThisMonth: newThisMonth,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(term) ||
          u.full_name?.toLowerCase().includes(term)
      );
    }

    if (planFilter !== "all") {
      if (planFilter === "pro") {
        filtered = filtered.filter(u => u.subscription_status === "active" && u.plan_type !== "free");
      } else if (planFilter === "free") {
        filtered = filtered.filter(u => !u.subscription_status || u.subscription_status !== "active" || u.plan_type === "free");
      }
    }

    setFilteredUsers(filtered);
  };

  const handleSetPlan = async (userId: string, planType: "free" | "pro" | "business") => {
    try {
      if (planType === "free") {
        // Use edge function to bypass RLS
        const { error } = await supabase.functions.invoke("admin-settings", {
          body: {
            action: "delete",
            table: "subscriptions",
            data: { user_id: userId }
          }
        });

        if (error) throw error;
        toast.success("Usuário alterado para plano Gratuito");
      } else {
        // Find the plan ID
        const plan = plans.find(p => p.plan_type === planType);
        if (!plan) {
          toast.error("Plano não encontrado");
          return;
        }

        // Use edge function to bypass RLS
        const { error } = await supabase.functions.invoke("admin-settings", {
          body: {
            action: "update",
            table: "subscriptions",
            data: {
              user_id: userId,
              plan_id: plan.id,
              status: "active",
              billing_period: "yearly",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }
          }
        });

        if (error) throw error;

        toast.success(`Usuário alterado para plano ${plan.name}`);
      }

      loadUsers();
    } catch (error) {
      console.error("Error setting plan:", error);
      toast.error("Erro ao alterar plano do usuário");
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        toast.error("Você não pode bloquear a si próprio!");
        return;
      }

      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update",
          table: "profiles",
          data: {
            id: userId,
            is_blocked: !currentStatus
          }
        }
      });

      if (error) throw error;
      toast.success(currentStatus ? "Usuário desbloqueado!" : "Usuário bloqueado!");
      loadUsers();
    } catch (error) {
      console.error("Error toggling block:", error);
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const userId = userToDelete;

    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "delete",
          table: "users",
          data: { id: userId }
        }
      });

      if (error) throw error;
      toast.success("Usuário excluído com sucesso!");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário");
    }
  };


  if (adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie usuários, assinaturas e configurações do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config. Pagamento
            </TabsTrigger>
            <TabsTrigger value="pix_history" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Histórico PIX
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total de Usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    Usuários Pro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats.proUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    Usuários Free
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.freeUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Novos Este Mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats.newUsersThisMonth}</p>
                </CardContent>
              </Card>
            </div>{/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os usuários cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="pro">Plano Pro/Business</SelectItem>
                      <SelectItem value="free">Plano Gratuito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="hidden sm:table-cell">Email</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Nenhum usuário encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{user.full_name || "Sem nome"}</div>
                                  {user.is_blocked && (
                                    <Badge variant="destructive" className="h-4 px-1 text-[8px] uppercase">Bloqueado</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground sm:hidden">
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.subscription_status === "active" && user.plan_type !== "free"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {user.plan_name}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {user.created_at
                                    ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleSetPlan(user.id, "free")}>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Definir como Free
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetPlan(user.id, "pro")}>
                                      <Crown className="h-4 w-4 mr-2" />
                                      Definir como Pro
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetPlan(user.id, "business")}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Definir como Business
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleToggleBlock(user.id, user.is_blocked || false)}
                                      className={user.is_blocked ? "text-green-600" : "text-amber-600"}
                                    >
                                      {user.is_blocked ? (
                                        <UserCheck className="h-4 w-4 mr-2" />
                                      ) : (
                                        <ShieldOff className="h-4 w-4 mr-2" />
                                      )}
                                      {user.is_blocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setUserToDelete(user.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir Permanentemente
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {filteredUsers.length} de {users.length} usuários
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mercado Pago Config Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Configuração Mercado Pago
                  </CardTitle>
                  <CardDescription>
                    Configure as chaves da API do Mercado Pago para processamento de pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Token (Chave Privada - BACKEND)</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="APP_USR-..."
                        className="pl-10 border-amber-200"
                        value={mercadoPagoConfig.access_token}
                        onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, access_token: e.target.value })}
                      />
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1 font-medium bg-amber-50 p-2 rounded border border-amber-100">
                      ⚠️ <strong>ERRO COMUM:</strong> O <strong>Access Token</strong> é muito mais longo (aprox. 80 caracteres).
                      Copie do campo "Access Token" no painel do Mercado Pago.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Public Key (Chave Pública - FRONTEND)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="APP_USR-..."
                        className="pl-10"
                        value={mercadoPagoConfig.public_key}
                        onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, public_key: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSaveMercadoPagoConfig}
                    disabled={savingMercadoPago}
                  >
                    {savingMercadoPago ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Configuração"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Summary / Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Integração</CardTitle>
                  <CardDescription>Visão geral do sistema de cobrança</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${mercadoPagoConfig.access_token ? 'bg-green-100' : 'bg-red-100'}`}>
                          {mercadoPagoConfig.access_token ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Mercado Pago</p>
                          <p className="text-xs text-muted-foreground">
                            {mercadoPagoConfig.access_token ? "Configurado e Ativo" : "Pendente"}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div></CardContent>
              </Card>
            </div>{/* Plan Prices Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Valores dos Planos
                </CardTitle>
                <CardDescription>
                  Ajuste os preços mensais e anuais de cada plano. Informe os valores em reais (Ex: 29,90)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPlans ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço Mensal (R$)</TableHead>
                        <TableHead>Preço Anual (R$)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fullPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{plan.plan_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              className="w-32"
                              value={formatCentsToBRL(plan.price_monthly)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/[^\d]/g, "");
                                const cents = parseInt(rawValue) || 0;
                                const newPlans = fullPlans.map(p =>
                                  p.id === plan.id ? { ...p, price_monthly: cents } : p
                                );
                                setFullPlans(newPlans);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              className="w-32"
                              value={formatCentsToBRL(plan.price_yearly)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/[^\d]/g, "");
                                const cents = parseInt(rawValue) || 0;
                                const newPlans = fullPlans.map(p =>
                                  p.id === plan.id ? { ...p, price_yearly: cents } : p
                                );
                                setFullPlans(newPlans);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePlan(plan)}
                              disabled={savingPlan === plan.id}
                            >
                              {savingPlan === plan.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pix_history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Pagamentos PIX</CardTitle>
                    <CardDescription>
                      Acompanhe todos os pagamentos PIX gerados e seus status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsClearPaymentsDialogOpen(true)}
                      disabled={loadingPayments || clearingPayments || payments.length === 0}
                    >
                      {clearingPayments ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Limpar Histórico
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => loadPayments(paymentsPage)} disabled={loadingPayments}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingPayments ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>ID Pagamento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum pagamento encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  <div className="font-medium">{payment.profiles?.full_name || "Usuário"}</div>
                                  <div className="text-xs text-muted-foreground">{payment.profiles?.email}</div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {payment.mercadopago_payment_id || "-"}
                                </TableCell>
                                <TableCell>
                                  R$ {formatCentsToBRL(payment.amount)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {payment.created_at ? format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                                        <Badge
                                          className={
                                            payment.status === "completed" ? "bg-green-500 hover:bg-green-600" :
                                              payment.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600" :
                                                "bg-red-500 hover:bg-red-600"
                                          }
                                        >
                                          {payment.status === "completed" ? "Aprovado" :
                                            payment.status === "pending" ? "Pendente" :
                                              "Falhou"}
                                        </Badge>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdatePaymentStatus(payment.id, "completed")}>
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                        Aprovado
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdatePaymentStatus(payment.id, "pending")}>
                                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                                        Pendente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdatePaymentStatus(payment.id, "failed")}>
                                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                        Falhou
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {paymentsTotalCount > paymentsPageSize && (
                      <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {(paymentsPage - 1) * paymentsPageSize + 1} a {Math.min(paymentsPage * paymentsPageSize, paymentsTotalCount)} de {paymentsTotalCount}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPayments(paymentsPage - 1)}
                            disabled={paymentsPage === 1 || loadingPayments}
                          >
                            Anterior
                          </Button>
                          <div className="text-sm font-medium">
                            Página {paymentsPage} de {Math.ceil(paymentsTotalCount / paymentsPageSize)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPayments(paymentsPage + 1)}
                            disabled={paymentsPage >= Math.ceil(paymentsTotalCount / paymentsPageSize) || loadingPayments}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <RegistrationControl />
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <CardTitle>Configuração Evolution API</CardTitle>
                </div>
                <CardDescription>
                  Configure as credenciais da Evolution API para envio de notificações via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      URL da API
                    </label>
                    <Input
                      placeholder="https://sua-api.com"
                      value={evolutionConfig.api_url}
                      onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="Sua API Key"
                      value={evolutionConfig.api_key}
                      onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Nome da Instância
                    </label>
                    <Input
                      placeholder="Ex: Financeiro Pro"
                      value={evolutionConfig.instance_name}
                      onChange={(e) => setEvolutionConfig({ ...evolutionConfig, instance_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveEvolutionConfig}
                    disabled={savingConfig}
                    className="flex-1 sm:flex-none"
                  >
                    {savingConfig ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Salvar Configuração
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleTestEvolutionConnection}
                    disabled={testingConnection || !evolutionConfig.api_url}
                    className="flex-1 sm:flex-none"
                  >
                    {testingConnection ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Configuração OpenAI</CardTitle>
                </div>
                <CardDescription>
                  Configure as credenciais da OpenAI para o Assistente Financeiro IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      OpenAI API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={openAiConfig.api_key}
                      onChange={(e) => setOpenAiConfig({ ...openAiConfig, api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Modelo de IA
                    </label>
                    <Select
                      value={openAiConfig.model}
                      onValueChange={(value) => setOpenAiConfig({ ...openAiConfig, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Mais inteligente)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o mini (Mais rápido/barato)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveOpenAiConfig}
                    disabled={savingOpenAi}
                    className="flex-1 sm:flex-none"
                  >
                    {savingOpenAi ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Salvar Configuração
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleTestOpenAiConnection}
                    disabled={testingOpenAi || !openAiConfig.api_key}
                    className="flex-1 sm:flex-none"
                  >
                    {testingOpenAi ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• A OpenAI é utilizada para o Assistente Financeiro IA processar perguntas complexas.</p>
                <p>• O modelo sugerido é o **GPT-4o mini** por ser eficiente e econômico.</p>
                <p>• O sistema utiliza estas configurações globalmente para todos os usuários.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear Payments Confirmation */}
      <AlertDialog open={isClearPaymentsDialogOpen} onOpenChange={setIsClearPaymentsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Histórico de Pagamentos?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todo o histórico de pagamentos? Esta ação não pode ser desfeita e todos os registros sumirão do painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearPayments} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              EXCLUIR USUÁRIO PERMANENTEMENTE?
            </AlertDialogTitle>
            <AlertDialogDescription>
              TEM CERTEZA? Esta ação excluirá PERMANENTEMENTE o usuário, sua conta de login e TODOS os seus dados financeiros. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Admin;
