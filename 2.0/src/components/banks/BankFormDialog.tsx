import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, Building2, X, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BankLogo } from "./BankLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bank, BankFormData } from "@/hooks/useBanks";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";

interface BankFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank?: Bank | null;
  onSubmit: (data: BankFormData, logoFile?: File) => Promise<void>;
  loading?: boolean;
  defaultProfileType?: FinancialProfile;
}

const accountTypes = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "investment", label: "Investimento" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "wallet", label: "Carteira Digital" },
];

const defaultColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const commonBanks = [
  { slug: "nubank", name: "Nubank", color: "#820ad1" },
  { slug: "itau", name: "Itaú", color: "#EC7000" },
  { slug: "bradesco", name: "Bradesco", color: "#cc092f" },
  { slug: "santander", name: "Santander", color: "#cc0000" },
  { slug: "bancodobrasil", name: "Banco do Brasil", color: "#fcfc30" },
  { slug: "caixa", name: "Caixa", color: "#005ca9" },
  { slug: "inter", name: "Inter", color: "#ff7a00" },
  { slug: "neon", name: "Neon", color: "#00e5ff" },
  { slug: "c6", name: "C6 Bank", color: "#2d2d2d" },
  { slug: "safra", name: "Safra", color: "#af9156" },
  { slug: "btg", name: "BTG Pactual", color: "#001e62" },
  { slug: "pagbank", name: "PagBank", color: "#47ba4c" },
  { slug: "sicoob", name: "Sicoob", color: "#00ae9d" },
  { slug: "sicredi", name: "Sicredi", color: "#34a338" },
];

const getInitialFormData = (profileType: FinancialProfile = "personal"): BankFormData => ({
  name: "",
  logo_url: null,
  bank_slug: null,
  initial_balance: 0,
  current_balance: 0,
  account_type: "checking",
  agency: "",
  account_number: "",
  color: "#3b82f6",
  notes: "",
  opening_date: "",
  is_active: true,
  profile_type: profileType,
});

export const BankFormDialog = ({
  open,
  onOpenChange,
  bank,
  onSubmit,
  loading = false,
  defaultProfileType = "personal",
}: BankFormDialogProps) => {
  const [formData, setFormData] = useState<BankFormData>(getInitialFormData(defaultProfileType));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bank) {
      setFormData({
        name: bank.name,
        logo_url: bank.logo_url,
        bank_slug: bank.bank_slug,
        initial_balance: bank.initial_balance,
        current_balance: bank.current_balance,
        account_type: bank.account_type,
        agency: bank.agency || "",
        account_number: bank.account_number || "",
        color: bank.color,
        notes: bank.notes || "",
        opening_date: bank.opening_date || "",
        is_active: bank.is_active,
        profile_type: bank.profile_type,
      });
      setLogoPreview(bank.logo_url);
    } else {
      setFormData(getInitialFormData(defaultProfileType));
      setLogoPreview(null);
    }
    setLogoFile(null);
  }, [bank, open, defaultProfileType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logo_url: null, bank_slug: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, logoFile || undefined);
  };

  const isPersonal = formData.profile_type === "personal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bank ? "Editar Banco" : "Novo Banco"}</DialogTitle>
          <DialogDescription>
            {bank
              ? "Atualize as informações do banco"
              : "Cadastre um novo banco ou conta para gerenciar suas finanças"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Perfil *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={isPersonal ? "default" : "outline"}
                className={isPersonal ? "bg-primary hover:bg-primary/90" : ""}
                onClick={() => setFormData({ ...formData, profile_type: "personal" })}
              >
                <User className="mr-2 h-4 w-4" />
                Pessoal
              </Button>
              <Button
                type="button"
                variant={!isPersonal ? "default" : "outline"}
                className={!isPersonal ? "bg-secondary hover:bg-secondary/90" : ""}
                onClick={() => setFormData({ ...formData, profile_type: "business" })}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Empresarial
              </Button>
            </div>
          </div>

          {/* Logo Selection and Upload */}
          <div className="space-y-4">
            <Label>Logotipo do Banco</Label>
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors relative group"
                style={{ backgroundColor: `${formData.color}20` }}
                onClick={() => !formData.bank_slug && fileInputRef.current?.click()}
              >
                {formData.bank_slug ? (
                  <BankLogo name={formData.bank_slug} size={80} className="w-full h-full" />
                ) : logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Building2
                      className="h-8 w-8 mx-auto mb-1"
                      style={{ color: formData.color }}
                    />
                    <span className="text-xs text-muted-foreground">Upload logo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {(logoPreview || formData.bank_slug) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeLogo}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Logotipo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ou selecione um banco conhecido:</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {commonBanks.map((bankOption) => (
                  <button
                    key={bankOption.slug}
                    type="button"
                    className={cn(
                      "p-1.5 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center",
                      formData.bank_slug === bankOption.slug 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-muted/30"
                    )}
                    title={bankOption.name}
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        bank_slug: bankOption.slug,
                        name: formData.name || bankOption.name,
                        color: bankOption.color
                      });
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                  >
                    <BankLogo name={bankOption.slug} size={28} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Banco *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nubank, Itaú, Caixa..."
              required
            />
          </div>

          {/* Account Type and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-1 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Agency and Account Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                placeholder="0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Número da Conta</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                placeholder="12345-6"
              />
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_balance">Saldo Inicial (R$)</Label>
              <CurrencyInput
                id="initial_balance"
                value={formData.initial_balance}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    initial_balance: value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_balance">Saldo Atual (R$)</Label>
              <CurrencyInput
                id="current_balance"
                value={formData.current_balance}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    current_balance: value,
                  })
                }
              />
            </div>
          </div>

          {/* Opening Date */}
          <div className="space-y-2">
            <Label htmlFor="opening_date">Data de Abertura</Label>
            <Input
              id="opening_date"
              type="date"
              value={formData.opening_date}
              onChange={(e) =>
                setFormData({ ...formData, opening_date: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre esta conta..."
              rows={2}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="is_active">Conta Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Contas inativas não aparecem no saldo total
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Salvando..." : bank ? "Atualizar" : "Criar Banco"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
