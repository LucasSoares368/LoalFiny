import { useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  Calculator,
  Car,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Shield,
  ShoppingCart,
  Sun,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Wallet,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuGroups = [
  {
    label: "Principal",
    items: [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: Wallet, label: "Carteira", path: "/carteira" },
      { icon: FileText, label: "Transações", path: "/transacoes" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { icon: CreditCard, label: "Receitas", path: "/receitas" },
      { icon: TrendingDown, label: "Despesas", path: "/despesas" },
      { icon: Target, label: "Metas", path: "/metas" },
      { icon: PiggyBank, label: "Reserva", path: "/metas" },
    ],
  },
  {
    label: "Operações",
    items: [
      { icon: Tag, label: "Categorias", path: "/categorias" },
      { icon: ShoppingCart, label: "Mercado", path: "/mercado" },
      { icon: Car, label: "Veículos", path: "/veiculos" },
      { icon: Bot, label: "IA", path: "/ia" },
    ],
  },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);
    document.documentElement.classList.toggle("dark", nextDarkMode);
    localStorage.setItem("theme", nextDarkMode ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("isAuthenticated");

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      {!isMobileMenuOpen ? (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      ) : null}

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={closeMobileMenu} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-[transform,width] duration-300 lg:translate-x-0 ${
          isSidebarCollapsed ? "lg:w-24" : "lg:w-64"
        } ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-16 items-center border-b border-slate-200 px-4 ${isSidebarCollapsed ? "lg:justify-between lg:px-2" : "justify-between"}`}>
          <Link to="/dashboard" className={`flex min-w-0 items-center ${isSidebarCollapsed ? "lg:hidden" : ""}`} onClick={closeMobileMenu}>
            <img src="/brand/logo.png" alt="LocalFiny" className="h-10 w-auto max-w-[170px] object-contain" />
          </Link>
          <Link to="/dashboard" className={`hidden min-w-0 items-center ${isSidebarCollapsed ? "lg:flex" : ""}`} onClick={closeMobileMenu}>
            <img src="/brand/icon.png" alt="LocalFiny" className="h-10 w-10 rounded-xl object-contain" />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-10 w-10 rounded-xl bg-[#FF6A00] text-white shadow-sm hover:bg-[#e85f00] lg:inline-flex"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className={`flex-1 overflow-y-auto py-5 ${isSidebarCollapsed ? "lg:px-2" : "px-3"}`}>
          <div className={isSidebarCollapsed ? "space-y-4 lg:space-y-3" : "space-y-7"}>
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className={`mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={`${group.label}-${item.label}`}
                        to={item.path}
                        onClick={closeMobileMenu}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          isSidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                        } ${
                          active
                            ? "bg-[#FF6A00]/10 text-[#0D1B2A] shadow-[inset_3px_0_0_#FF6A00]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={isSidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className={`border-t border-slate-200 p-4 ${isSidebarCollapsed ? "lg:px-2" : ""}`}>
          <div className={`mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Aparência</p>
            <Button
              variant="ghost"
              className="h-10 w-full justify-start gap-3 rounded-xl text-slate-600 hover:bg-white"
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDarkMode ? "Modo claro" : "Modo escuro"}
            </Button>
          </div>

          <Link
            to="/perfil"
            onClick={closeMobileMenu}
            title={isSidebarCollapsed ? "Meu perfil" : undefined}
            className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${
              isSidebarCollapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <UserCircle className="h-4 w-4 text-[#FF6A00]" />
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>Meu perfil</span>
          </Link>
          <div className={`grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            <button className="flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-slate-50">
              <Calculator className="h-3.5 w-3.5" />
              Calculadora
            </button>
            <button className="flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-slate-50">
              <Shield className="h-3.5 w-3.5" />
              Privacidade
            </button>
          </div>
          <Button
            variant="ghost"
            title={isSidebarCollapsed ? "Sair da conta" : undefined}
            className={`mt-3 h-10 w-full justify-start gap-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 ${
              isSidebarCollapsed ? "lg:justify-center lg:px-0" : ""
            }`}
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>Sair da conta</span>
          </Button>
        </div>
      </aside>

      <main className={`min-h-screen transition-[padding] duration-300 ${isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64"}`}>{children}</main>
    </div>
  );
};
