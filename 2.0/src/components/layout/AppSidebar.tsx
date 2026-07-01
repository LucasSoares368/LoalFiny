import { memo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FolderKanban,
  PieChart,
  Target,
  ShoppingCart,
  Map,
  FileUp,
  Shield,
  LogOut,
  Building2,
  CreditCard,
  Bot,
  Smartphone,
  Crown,
  Settings,
  StickyNote,
  Percent,
  Sparkles,
  LucideIcon,
  UserCircle,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAdmin } from "@/hooks/useAdmin";
import { useFinancialCalculator } from "@/hooks/useFinancialCalculator";

import ProfileSettings from "@/components/profile/ProfileSettings";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  highlight?: boolean;
}

const groups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Bancos", icon: Building2, path: "/banks" },
      { title: "Transações", icon: ArrowLeftRight, path: "/transactions" },
      { title: "Relatórios", icon: PieChart, path: "/reports" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { title: "Dívidas", icon: CreditCard, path: "/debts" },
      { title: "Metas", icon: Target, path: "/goals" },
      { title: "Reserva de Emergência", icon: Shield, path: "/emergency-reserve" },
      { title: "Jornada Financeira", icon: Map, path: "/independence-map" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Categorias", icon: FolderKanban, path: "/categories" },
      { title: "Mercado", icon: ShoppingCart, path: "/market" },
      { title: "Divisão Automática", icon: Percent, path: "/split-config" },
      { title: "Bloco de Notas", icon: StickyNote, path: "/notes" },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { title: "Assistente IA", icon: Sparkles, path: "/ai-chat", highlight: true },
      { title: "Assistente Virtual", icon: Bot, path: "/whatsapp" },
      { title: "Importar Dados", icon: FileUp, path: "/import-data" },
    ],
  },
  {
    label: "App",
    items: [
      { title: "Planos e Preços", icon: Crown, path: "/upgrade", highlight: true },
      { title: "Instalar App", icon: Smartphone, path: "/install" },
    ],
  },
];

const MemoizedMenuItem = memo(function MemoizedMenuItem({
  item,
  isActive,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onClick}
        tooltip={item.title}
        className={cn(
          "transition-all duration-200 group/btn h-9",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm font-medium"
            : item.highlight
              ? "text-primary font-semibold hover:bg-primary/10"
              : "hover:bg-sidebar-accent",
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:scale-110",
            isActive
              ? "text-primary-foreground"
              : item.highlight
                ? "text-primary"
                : "text-muted-foreground group-hover/btn:text-sidebar-foreground",
          )}
        />
        <span className="flex-1 truncate">{item.title}</span>
        {isActive && <ChevronRight className="h-3 w-3 opacity-50 ml-auto animate-in fade-in slide-in-from-left-1" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

export const AppSidebar = memo(function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { setOpen: setCalculatorOpen } = useFinancialCalculator();
  const { setShowBanner } = useCookieConsent();

  const handleSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
      return;
    }
    navigate("/");
    toast.success("Logout realizado com sucesso");
  }, [navigate]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-0 h-14 flex items-center shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer group/logo w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
          onClick={() => handleNavigate("/dashboard")}
        >
          <div className="flex items-center justify-center h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 rounded-xl bg-primary/10 text-primary font-black text-xl group-data-[collapsible=icon]:text-base group-hover/logo:bg-primary group-hover/logo:text-white transition-all duration-300 shadow-sm border border-primary/20 shrink-0">
            FP
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent group-data-[collapsible=icon]:hidden">
            Financeiro Pro
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="sidebar-scrollbar py-2 overflow-x-hidden">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <MemoizedMenuItem
                    key={item.path}
                    item={item}
                    isActive={location.pathname === item.path}
                    onClick={() => handleNavigate(item.path)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdmin && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-destructive/70 group-data-[collapsible=icon]:hidden">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === "/admin"}
                    onClick={() => handleNavigate("/admin")}
                    tooltip="Painel Admin"
                    className={cn(
                      "transition-all duration-200 h-9",
                      location.pathname === "/admin"
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "text-destructive hover:bg-destructive/10",
                    )}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Painel Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2 space-y-4">
        <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between px-3 py-2 bg-muted/50 rounded-xl border border-border/40 mx-1 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Aparência</span>
            <span className="text-[11px] font-medium text-foreground/80">Mudar Tema</span>
          </div>
          <ThemeToggle />
        </div>

        <SidebarMenu className="px-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <Sheet>
              <SheetTrigger asChild>
                <SidebarMenuButton className="h-10 hover:bg-primary/5 rounded-lg group/profile" tooltip="Meu Perfil">
                  <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5 group-hover/profile:ring-primary/20 transition-all shrink-0">
                      <UserCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm truncate group-data-[collapsible=icon]:hidden">
                      Meu Perfil
                    </span>
                  </div>
                </SidebarMenuButton>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="pb-6 border-b border-border/60">
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-primary" />
                    Meu Perfil
                  </SheetTitle>
                  <SheetDescription>Gerencie suas informações pessoais e configurações de segurança.</SheetDescription>
                </SheetHeader>
                <ProfileSettings />
              </SheetContent>
            </Sheet>
          </SidebarMenuItem>

          <div className="grid grid-cols-2 gap-2 py-1 group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:gap-1">
            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton
                onClick={() => setCalculatorOpen(true)}
                className="h-9 hover:bg-primary/5 rounded-lg text-xs justify-center gap-2 group-data-[collapsible=icon]:p-0"
                tooltip="Calculadora"
              >
                <Calculator className="h-3.5 w-3.5 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Calculadora</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="col-span-1">
              <SidebarMenuButton
                onClick={() => setShowBanner(true)}
                className="h-9 hover:bg-primary/5 rounded-lg text-xs justify-center gap-2 group-data-[collapsible=icon]:p-0"
                tooltip="Privacidade"
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Privacidade</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="h-10 text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-lg transition-all mt-2 font-semibold justify-start group-data-[collapsible=icon]:justify-center"
              tooltip="Sair"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair da Conta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});
