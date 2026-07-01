import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";

export interface Bank {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  bank_slug: string | null;
  initial_balance: number;
  current_balance: number;
  account_type: string;
  agency: string | null;
  account_number: string | null;
  color: string;
  notes: string | null;
  opening_date: string | null;
  is_active: boolean;
  profile_type: "personal" | "business";
  created_at: string;
  updated_at: string;
}

export interface BankFormData {
  name: string;
  logo_url: string | null;
  bank_slug: string | null;
  initial_balance: number;
  current_balance: number;
  account_type: string;
  agency: string;
  account_number: string;
  color: string;
  notes: string;
  opening_date: string;
  is_active: boolean;
  profile_type: "personal" | "business";
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeBank = (bank: any): Bank => ({
  ...bank,
  name: bank?.name || "Banco",
  logo_url: bank?.logo_url || null,
  bank_slug: bank?.bank_slug || null,
  initial_balance: toNumber(bank?.initial_balance),
  current_balance: toNumber(bank?.current_balance),
  account_type: bank?.account_type || "checking",
  agency: bank?.agency || null,
  account_number: bank?.account_number || null,
  color: bank?.color || "#ff6a00",
  notes: bank?.notes || null,
  opening_date: bank?.opening_date || null,
  is_active: bank?.is_active !== false && bank?.is_active !== 0,
  profile_type: bank?.profile_type === "business" ? "business" : "personal",
});

const normalizeBanks = (banks: any[] | null | undefined) => (banks || []).map(normalizeBank);

export const useBanks = (profileType: FinancialProfile = "personal") => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBanks = useCallback(async () => {
    setLoading(true);
    try {
      // Load banks filtered by profile type
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .eq("profile_type", profileType)
        .order("name");

      if (error) {
        // Handle JWT expired by refreshing session
        if (error.message?.includes("JWT expired") || error.code === "PGRST303") {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            // Retry after refresh
            const { data: retryData, error: retryError } = await supabase
              .from("banks")
              .select("*")
              .eq("profile_type", profileType)
              .order("name");
            if (!retryError) {
              setBanks(normalizeBanks(retryData));
              return;
            }
          }
        }
        throw error;
      }
      setBanks(normalizeBanks(data));
    } catch (error: any) {
      toast.error("Erro ao carregar bancos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [profileType]);

  const loadAllBanks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .order("name");

      if (error) {
        // Handle JWT expired by refreshing session
        if (error.message?.includes("JWT expired") || error.code === "PGRST303") {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            // Retry after refresh
            const { data: retryData, error: retryError } = await supabase
              .from("banks")
              .select("*")
              .order("name");
            if (!retryError) {
              setAllBanks(normalizeBanks(retryData));
              return;
            }
          }
        }
        throw error;
      }
      setAllBanks(normalizeBanks(data));
    } catch (error: any) {
      console.error("Error loading all banks:", error);
    }
  }, []);

  const createBank = async (formData: BankFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("banks")
        .insert({
          user_id: user.id,
          name: formData.name,
          logo_url: formData.logo_url,
          bank_slug: formData.bank_slug,
          initial_balance: formData.initial_balance,
          current_balance: formData.current_balance,
          account_type: formData.account_type,
          agency: formData.agency || null,
          account_number: formData.account_number || null,
          color: formData.color,
          notes: formData.notes || null,
          opening_date: formData.opening_date || null,
          is_active: formData.is_active,
          profile_type: formData.profile_type,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Banco cadastrado com sucesso!");
      await Promise.all([loadBanks(), loadAllBanks()]);
      return normalizeBank(data);
    } catch (error: any) {
      toast.error("Erro ao criar banco: " + error.message);
      return null;
    }
  };

  const updateBank = async (id: string, formData: Partial<BankFormData>) => {
    try {
      // Convert empty strings to null for nullable fields
      const sanitizedData = {
        ...formData,
        opening_date: formData.opening_date === "" ? null : formData.opening_date,
        agency: formData.agency === "" ? null : formData.agency,
        account_number: formData.account_number === "" ? null : formData.account_number,
        notes: formData.notes === "" ? null : formData.notes,
      };

      const { error } = await supabase
        .from("banks")
        .update(sanitizedData)
        .eq("id", id);

      if (error) throw error;
      toast.success("Banco atualizado com sucesso!");
      await Promise.all([loadBanks(), loadAllBanks()]);
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar banco: " + error.message);
      return false;
    }
  };

  const deleteBank = async (id: string) => {
    try {
      const { error } = await supabase
        .from("banks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Banco removido com sucesso!");
      await Promise.all([loadBanks(), loadAllBanks()]);
      return true;
    } catch (error: any) {
      toast.error("Erro ao remover banco: " + error.message);
      return false;
    }
  };

  const uploadLogo = async (file: File, bankId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${bankId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("bank-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("bank-logos")
        .getPublicUrl(fileName);

      await updateBank(bankId, { logo_url: publicUrl });
      return publicUrl;
    } catch (error: any) {
      toast.error("Erro ao fazer upload do logo: " + error.message);
      return null;
    }
  };

  const getTotalBalance = () => {
    return banks.filter(b => b.is_active).reduce((sum, bank) => sum + toNumber(bank.current_balance), 0);
  };

  const getAllBanksTotalBalance = () => {
    return allBanks.filter(b => b.is_active).reduce((sum, bank) => sum + toNumber(bank.current_balance), 0);
  };

  useEffect(() => {
    loadBanks();
    loadAllBanks();
  }, [loadBanks, loadAllBanks]);

  return {
    banks,
    allBanks,
    loading,
    loadBanks,
    loadAllBanks,
    createBank,
    updateBank,
    deleteBank,
    uploadLogo,
    getTotalBalance,
    getAllBanksTotalBalance,
  };
};
