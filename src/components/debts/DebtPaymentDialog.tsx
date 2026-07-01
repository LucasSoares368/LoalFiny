import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Debt {
  id: string;
  name: string;
  current_balance: number;
  minimum_payment: number | null;
}

interface DebtPaymentDialogProps {
  debt: Debt | null;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DebtPaymentDialog({ debt, onClose, onSuccess }: DebtPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!debt) return;
    setAmount(Number(debt.minimum_payment || 0));
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  }, [debt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!debt || amount <= 0) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    const currentBalance = Number(debt.current_balance || 0);

    if (amount > currentBalance) {
      toast.error("Valor maior que o saldo devedor");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const { error: paymentError } = await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        user_id: user.id,
        amount,
        payment_date: paymentDate,
        notes: notes.trim() || null,
      });

      if (paymentError) throw paymentError;

      const newBalance = Math.max(currentBalance - amount, 0);
      const { error: debtError } = await supabase
        .from("debts")
        .update({
          current_balance: newBalance,
          status: newBalance <= 0 ? "paid" : "active",
        })
        .eq("id", debt.id);

      if (debtError) throw debtError;

      toast.success(newBalance <= 0 ? "Dívida quitada!" : "Pagamento registrado!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao registrar pagamento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!debt) return null;

  const currentBalance = Number(debt.current_balance || 0);
  const minimumPayment = Number(debt.minimum_payment || 0);

  return (
    <Dialog open={!!debt} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            {debt.name} - saldo devedor {formatCurrency(currentBalance)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="payment_amount">Valor do Pagamento *</Label>
            <CurrencyInput
              id="payment_amount"
              value={amount}
              onChange={setAmount}
              placeholder="0,00"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {minimumPayment > 0 && (
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setAmount(minimumPayment)}>
                Mínimo: {formatCurrency(minimumPayment)}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setAmount(currentBalance)}>
              Quitar: {formatCurrency(currentBalance)}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Data do Pagamento</Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_notes">Observações</Label>
            <Textarea
              id="payment_notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex: Parcela 5 de 12..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-11 flex-1 rounded-2xl" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 flex-1 rounded-2xl font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
