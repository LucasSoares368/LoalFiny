import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { gerarReceitasRecorrentesPendentes } from "@/lib/receitas-recorrentes";
import { queryKeys } from "@/lib/queryClient";

export interface Receita {
  id: string;
  user_id: string;
  bank_account_id?: string | null;
  categoria_id?: string;
  descricao: string;
  valor: number;
  data: string;
  recorrente: boolean;
  dia_recorrencia?: number | null;
  receita_pai_id?: string | null;
  frequencia_recorrencia?: "mensal" | "quinzenal" | "semanal";
  data_fim_recorrencia?: string | null;
  forma_pagamento?: string | null;
  status_recebimento?: "recebido" | "pendente";
  tipo_receita?: "fixa" | "variavel";
  created_at: string;
  updated_at: string;
  categorias?: { nome: string; cor: string; icone: string };
  bank_accounts?: { id: string; name: string; bank_name: string } | null;
}

async function fetchReceitas() {
  await gerarReceitasRecorrentesPendentes();

  const { data: receitasData, error: receitasError } = await supabase
    .from("receitas")
    .select("*, categorias (nome, cor, icone), bank_accounts (id, name, bank_name)");
  if (receitasError) throw receitasError;

  const { data: transacoesData, error: transacoesError } = await supabase
    .from("transacoes")
    .select("*, categorias (nome, cor, icone)")
    .eq("tipo", "receita");
  if (transacoesError) throw transacoesError;

  const allReceitas = [
    ...(receitasData || []),
    ...(transacoesData || []).map((transacao: any) => ({
      ...transacao,
      recorrente: false,
      receita_pai_id: null,
      dia_recorrencia: null,
      frequencia_recorrencia: "mensal" as const,
      data_fim_recorrencia: null,
      forma_pagamento: null,
      status_recebimento: "recebido" as const,
      tipo_receita: "variavel" as const,
      bank_account_id: null,
      bank_accounts: null,
    })),
  ];

  return allReceitas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) as Receita[];
}

export const useReceitas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.receitas, queryFn: fetchReceitas });

  useEffect(() => {
    if (query.error) {
      toast({ title: "Erro ao carregar receitas", description: (query.error as Error).message, variant: "destructive" });
    }
  }, [query.error, toast]);

  const invalidateFinancial = () => queryClient.invalidateQueries({ queryKey: queryKeys.financial });

  const createReceita = async (
    receita: Omit<Receita, "id" | "user_id" | "created_at" | "updated_at" | "categorias" | "bank_accounts">,
  ) => {
    try {
      const { data, error } = await supabase
        .from("receitas")
        .insert([{ ...receita, user_id: (await supabase.auth.getUser()).data.user?.id }])
        .select("*, categorias (nome, cor, icone), bank_accounts (id, name, bank_name)")
        .single();

      if (error) throw error;
      await invalidateFinancial();
      toast({ title: "Receita criada", description: "Receita criada com sucesso!" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Erro ao criar receita", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const updateReceita = async (id: string, updates: Partial<Receita>) => {
    try {
      const { data, error } = await supabase
        .from("receitas")
        .update(updates)
        .eq("id", id)
        .select("*, categorias (nome, cor, icone), bank_accounts (id, name, bank_name)")
        .single();

      if (error) throw error;
      await invalidateFinancial();
      toast({ title: "Receita atualizada", description: "Receita atualizada com sucesso!" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Erro ao atualizar receita", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteReceita = async (id: string) => {
    try {
      const { data: receitaAtual } = await supabase.from("receitas").select("recorrente").eq("id", id).single();
      const { error } = await supabase.from("receitas").delete().eq("id", id);
      if (error) throw error;

      if (receitaAtual?.recorrente) {
        const { error: filhosError } = await supabase.from("receitas").delete().eq("receita_pai_id", id);
        if (filhosError) throw filhosError;
      }

      await invalidateFinancial();
      toast({ title: "Receita removida", description: "Receita removida com sucesso!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro ao remover receita", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  return {
    receitas: query.data || [],
    loading: query.isLoading,
    createReceita,
    updateReceita,
    deleteReceita,
    refetch: query.refetch,
  };
};
