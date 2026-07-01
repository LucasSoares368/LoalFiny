import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, DollarSign, Calendar, Percent, Building2 } from "lucide-react";

interface Debt {
  id: string;
  name: string;
  creditor: string | null;
  total_amount: number;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_day: number | null;
  start_date: string | null;
  status: string;
  notes: string | null;
}

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
  onPayment: (debt: Debt) => void;
}

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DebtCard({ debt, onEdit, onDelete, onPayment }: DebtCardProps) {
  const totalAmount = Number(debt.total_amount || 0);
  const currentBalance = Number(debt.current_balance || 0);
  const paidAmount = Math.max(totalAmount - currentBalance, 0);
  const progressPercent = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;
  const isPaid = debt.status === "paid" || currentBalance <= 0;

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isPaid ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-xl font-bold text-foreground">{debt.name}</h3>
            {isPaid && (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                Quitada
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{debt.creditor || "Credor não informado"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => onEdit(debt)} className="h-9 w-9 rounded-xl">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(debt.id)}
            className="h-9 w-9 rounded-xl text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-red-500/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">Saldo Devedor</p>
          <p className={`mt-1 text-2xl font-bold ${isPaid ? "text-emerald-600" : "text-red-500"}`}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Valor Original</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pago: {formatCurrency(paidAmount)}</span>
          <span>Restante: {formatCurrency(currentBalance)}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <span>{Number(debt.interest_rate || 0).toLocaleString("pt-BR")} % a.m.</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span>Mín: {formatCurrency(Number(debt.minimum_payment || 0))}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{debt.due_day ? `Vence dia ${debt.due_day}` : "Sem vencimento"}</span>
        </div>
      </div>

      {debt.notes && (
        <p className="mt-4 rounded-2xl bg-muted/40 p-3 text-sm text-muted-foreground">{debt.notes}</p>
      )}

      {!isPaid && (
        <Button className="mt-5 h-11 w-full rounded-2xl font-semibold" onClick={() => onPayment(debt)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar Pagamento
        </Button>
      )}
    </div>
  );
}
