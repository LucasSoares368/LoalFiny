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
      { icon: Wallet, label: "Bancos", path: "/carteira" },
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

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <img src="/brand/icon.png" alt="LocalFiny" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-bold text-[#FF6A00]">LocalFiny</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-7">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
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
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "bg-[#FF6A00]/10 text-[#0D1B2A] shadow-[inset_3px_0_0_#FF6A00]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UserCircle className="h-4 w-4 text-[#FF6A00]" />
            Meu perfil
          </Link>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
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
            className="mt-3 h-10 w-full justify-start gap-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">{children}</main>
    </div>
  );
};
