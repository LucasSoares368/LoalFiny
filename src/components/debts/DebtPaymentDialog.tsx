import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";

interface Debt {
  id: string;
  name: string;
  current_balance: number;
  minimum_payment: number | null;
}

interface DebtPaymentDialogProps {
  debt: Debt | null;
  profileType: FinancialProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Bank {
  id: string;
  name: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export function DebtPaymentDialog({ debt, profileType, onClose, onSuccess }: DebtPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankId, setBankId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!debt) return;

    const loadBanks = async () => {
      setBanksLoading(true);
      try {
        const { data, error } = await supabase
          .from("banks")
          .select("id, name, account_type, current_balance, is_active")
          .eq("profile_type", profileType)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;

        const normalizedBanks = (data || []).map((bank: any) => ({
          id: bank.id,
          name: bank.name || "Banco",
          account_type: bank.account_type || "checking",
          current_balance: Number(bank.current_balance || 0),
          is_active: bank.is_active !== false && bank.is_active !== 0,
        }));
        setBanks(normalizedBanks);

        if (normalizedBanks.length === 1) {
          setBankId(normalizedBanks[0].id);
          setPaymentMethod(normalizedBanks[0].account_type === "credit_card" ? "credit_card" : "pix");
        }
      } catch (error: any) {
        toast.error("Erro ao carregar bancos: " + error.message);
      } finally {
        setBanksLoading(false);
      }
    };

    loadBanks();
  }, [debt, profileType]);

  useEffect(() => {
    if (!debt) return;
    setAmount(Number(debt.minimum_payment || 0));
    setBankId("");
    setPaymentMethod("pix");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  }, [debt]);

  const getDebtCategoryId = async (userId: string) => {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    if (error) throw error;

    const existing = (categories || []).find((category: any) => normalizeText(category.name || "") === "dividas");
    if (existing?.id) return existing.id;

    const { data: createdCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Dívidas",
        icon: "💳",
        color: "#ef4444",
        profile_type: profileType,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    return createdCategory?.id || null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!debt || amount <= 0) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    if (!bankId) {
      toast.error("Selecione o banco ou cartão do pagamento");
      return;
    }

    const currentBalance = Number(debt.current_balance || 0);
    const selectedBank = banks.find((bank) => bank.id === bankId);

    if (amount > currentBalance) {
      toast.error("Valor maior que o saldo devedor");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      if (!selectedBank) throw new Error("Banco selecionado não encontrado");

      const categoryId = await getDebtCategoryId(user.id);

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount,
          type: "expense",
          category_id: categoryId,
          description: `Pagamento de dívida: ${debt.name}`,
          date: paymentDate,
          transaction_time: getCurrentTime(),
          profile_type: profileType,
          bank_id: bankId,
          payment_method: paymentMethod,
          is_essential: true,
        })
        .select("id")
        .single();

      if (transactionError) throw transactionError;

      const { error: paymentError } = await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        bank_id: bankId,
        transaction_id: transaction?.id || null,
        user_id: user.id,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        profile_type: profileType,
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

      const { error: bankError } = await supabase
        .from("banks")
        .update({ current_balance: Number(selectedBank.current_balance || 0) - amount })
        .eq("id", bankId);

      if (bankError) throw bankError;

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
  const selectedBank = banks.find((bank) => bank.id === bankId);

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
            <Label>Banco/Cartão *</Label>
            <Select
              value={bankId}
              onValueChange={(value) => {
                const bank = banks.find((item) => item.id === value);
                setBankId(value);
                if (bank?.account_type === "credit_card") {
                  setPaymentMethod("credit_card");
                }
              }}
              disabled={banksLoading}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione de onde saiu o pagamento"} />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name} - {formatCurrency(bank.current_balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBank && (
              <p className="text-xs text-muted-foreground">
                O saldo desta conta será reduzido em {formatCurrency(amount)}.
              </p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label>Meio de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione o meio de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="debit_card">Débito</SelectItem>
                <SelectItem value="credit_card">Crédito</SelectItem>
                <SelectItem value="bank_transfer">Transferência</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
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
