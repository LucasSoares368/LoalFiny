import { Building2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bank } from "@/hooks/useBanks";
import { motion } from "framer-motion";

interface BanksOverviewProps {
  banks: Bank[];
}

export const BanksOverview = ({ banks }: BanksOverviewProps) => {
  const activeBanks = banks.filter((b) => b.is_active);
  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  
  const totalBalance = activeBanks.reduce(
    (sum, bank) => sum + toNumber(bank.current_balance),
    0
  );
  
  const positiveBalance = activeBanks
    .filter((b) => toNumber(b.current_balance) > 0)
    .reduce((sum, b) => sum + toNumber(b.current_balance), 0);
    
  const negativeBalance = Math.abs(
    activeBanks
      .filter((b) => toNumber(b.current_balance) < 0)
      .reduce((sum, b) => sum + toNumber(b.current_balance), 0)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const stats = [
    {
      title: "Saldo Total",
      value: formatCurrency(totalBalance),
      description: "Saldo consolidado",
      icon: Wallet,
      color: totalBalance >= 0 ? "text-success" : "text-danger",
      bgColor: totalBalance >= 0 ? "bg-success/10" : "bg-danger/10",
    },
    {
      title: "Contas Ativas",
      value: activeBanks.length.toString(),
      description: "Cadastradas",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Saldo Positivo",
      value: formatCurrency(positiveBalance),
      description: "Contas no positivo",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Saldo Negativo",
      value: formatCurrency(negativeBalance),
      description: "Contas no negativo",
      icon: TrendingDown,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full rounded-2xl border-border/80 shadow-sm">
            <CardContent className="flex min-h-[128px] flex-col justify-between p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  {stat.title}
                </span>
                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className={`truncate text-2xl font-bold sm:text-3xl ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
