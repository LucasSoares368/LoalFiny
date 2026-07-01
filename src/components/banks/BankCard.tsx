import { useState } from "react";
import { Building2, Edit, Trash2, MoreVertical, CreditCard, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Bank } from "@/hooks/useBanks";
import { motion } from "framer-motion";

interface BankCardProps {
  bank: Bank;
  onEdit: (bank: Bank) => void;
  onDelete: (id: string) => void;
}

const accountTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  checking: { label: "Conta Corrente", icon: <Building2 className="h-4 w-4" /> },
  savings: { label: "Poupança", icon: <PiggyBank className="h-4 w-4" /> },
  investment: { label: "Investimento", icon: <TrendingUp className="h-4 w-4" /> },
  credit_card: { label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4" /> },
  wallet: { label: "Carteira Digital", icon: <Wallet className="h-4 w-4" /> },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const BankCard = ({ bank, onEdit, onDelete }: BankCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const name = bank.name || "Banco";
  const color = bank.color || "#ff6a00";
  const balance = Number.isFinite(Number(bank.current_balance)) ? Number(bank.current_balance) : 0;
  const logoBackground = color.startsWith("#") ? `${color}1A` : "hsl(var(--muted))";
  const accountType = accountTypeLabels[bank.account_type] || accountTypeLabels.checking;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card
          className="overflow-hidden rounded-2xl border-l-4 border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderLeftColor: color }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background"
                  style={{ backgroundColor: logoBackground }}
                >
                  {bank.bank_slug ? (
                    <BankLogo name={bank.bank_slug} size={54} className="h-full w-full" />
                  ) : bank.logo_url ? (
                    <img src={bank.logo_url} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6" style={{ color }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-foreground">{name}</h3>
                    {!bank.is_active && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        Inativo
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-base text-muted-foreground">
                    {accountType.icon}
                    <span className="truncate">{accountType.label}</span>
                  </div>

                  {(bank.agency || bank.account_number) && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {bank.agency && `Ag: ${bank.agency}`}
                      {bank.agency && bank.account_number && " - "}
                      {bank.account_number && `Cc: ${bank.account_number}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <div className="min-w-[124px] text-right">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`truncate text-2xl font-bold ${balance >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(bank)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {bank.notes && (
              <p className="mt-4 line-clamp-1 border-t border-border pt-3 text-sm text-muted-foreground">
                {bank.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{name}"? Esta ação não pode ser desfeita.
              As transações vinculadas a este banco não serão excluídas, mas perderão a associação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(bank.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
