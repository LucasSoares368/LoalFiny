import { useState } from "react";
import { Plus, Search, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { BankCard } from "@/components/banks/BankCard";
import { BankFormDialog } from "@/components/banks/BankFormDialog";
import { BanksOverview } from "@/components/banks/BanksOverview";
import { useBanks, Bank, BankFormData } from "@/hooks/useBanks";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";

const Banks = () => {
  const [currentProfile, setCurrentProfile] = useState<FinancialProfile>("personal");
  const { banks, loading, createBank, updateBank, deleteBank, uploadLogo } = useBanks(currentProfile);
  const { canUseBusinessProfile, refetch: refetchPlan } = useUserPlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredBanks = banks.filter((bank) => {
    if (!normalizedSearch) return true;

    return [
      bank.name,
      bank.notes,
      bank.account_type,
      bank.agency,
      bank.account_number,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
  });

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteBank(id);
  };

  const handleSubmit = async (data: BankFormData, logoFile?: File) => {
    setSubmitting(true);
    try {
      if (editingBank) {
        const success = await updateBank(editingBank.id, data);
        if (success && logoFile) {
          await uploadLogo(logoFile, editingBank.id);
        }
      } else {
        const newBank = await createBank(data);
        if (newBank && logoFile) {
          await uploadLogo(logoFile, newBank.id);
        }
        refetchPlan();
      }
      setDialogOpen(false);
      setEditingBank(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingBank(null);
    setDialogOpen(true);
  };

  const handleProfileChange = (profile: FinancialProfile) => {
    if (profile === "business" && !canUseBusinessProfile()) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentProfile(profile);
  };

  const isPersonal = currentProfile === "personal";

  return (
    <AppLayout
      showProfileSwitcher
      currentProfile={currentProfile}
      onProfileChange={handleProfileChange}
      title="Meus Bancos"
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-4 ${isPersonal ? "bg-primary/10" : "bg-secondary/10"}`}>
              {isPersonal ? (
                <User className="h-7 w-7 text-primary" />
              ) : (
                <Building2 className="h-7 w-7 text-secondary" />
              )}
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                Bancos {isPersonal ? "Pessoais" : "Empresariais"}
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie suas contas {isPersonal ? "pessoais" : "empresariais"}
              </p>
            </div>
          </div>

          <Button onClick={handleOpenDialog} className="h-12 shrink-0 rounded-2xl px-8 text-base font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Novo Banco
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : banks.length > 0 ? (
          <BanksOverview banks={banks} />
        ) : null}

        <div className="relative mt-10 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar bancos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 rounded-2xl pl-12 text-base"
          />
        </div>

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <Building2 className="mb-5 h-20 w-20 text-muted-foreground/35" />
            <h3 className="mb-3 text-2xl font-bold">
              {searchQuery ? "Nenhum banco encontrado" : `Nenhum banco ${isPersonal ? "pessoal" : "empresarial"} cadastrado`}
            </h3>
            <p className="mb-6 text-lg text-muted-foreground">
              {searchQuery
                ? "Tente buscar com outros termos"
                : `Comece cadastrando seu primeiro banco ${isPersonal ? "pessoal" : "empresarial"}`}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenDialog} className="h-12 rounded-2xl px-8 text-base font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Banco
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredBanks.map((bank) => (
              <BankCard
                key={bank.id}
                bank={bank}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BankFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bank={editingBank}
        onSubmit={handleSubmit}
        loading={submitting}
        defaultProfileType={currentProfile}
      />
      <UpgradePrompt
        feature="Controle PF/PJ"
        description="O controle separado de perfil Pessoal e Empresarial está disponível no plano Pro Plus."
        variant="modal"
        requiredPlan="pro_plus"
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        benefits={["Controle separado PF e PJ", "Caixa empresarial", "Relatório de rentabilidade", "Dashboard avançado consolidado"]}
      />
    </AppLayout>
  );
};

export default Banks;
