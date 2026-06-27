import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { gerarReceitasRecorrentesPendentes } from "@/lib/receitas-recorrentes";
import { queryKeys } from "@/lib/queryClient";

export interface Transacao {
  id: string;
  user_id: string;
  categoria_id?: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data: string;
  created_at: string;
  updated_at: string;
  categorias?: {
    nome: string;
    cor: string;
    icone: string;
  };
}

async function fetchTransacoes() {
  await gerarReceitasRecorrentesPendentes();

  const { data: transacoesData, error: transacoesError } = await supabase
    .from("transacoes")
    .select("*, categorias (nome, cor, icone)");
  if (transacoesError) throw transacoesError;

  const { data: receitasData, error: receitasError } = await supabase
    .from("receitas")
    .select("*, categorias (nome, cor, icone)")
    .eq("recorrente", false);
  if (receitasError) throw receitasError;

  const { data: despesasData, error: despesasError } = await supabase
    .from("despesas")
    .select("*, categorias (nome, cor, icone)");
  if (despesasError) throw despesasError;

  const allTransacoes = [
    ...(transacoesData || []).map((t: any) => ({ ...t, tipo: t.tipo })),
    ...(receitasData || []).map((r: any) => ({ ...r, tipo: "receita" as const })),
    ...(despesasData || []).map((d: any) => ({ ...d, tipo: "despesa" as const })),
  ];

  return allTransacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) as Transacao[];
}

export const useTransacoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.transacoes, queryFn: fetchTransacoes });

  useEffect(() => {
    if (query.error) {
      toast({
        title: "Erro ao carregar transações",
        description: (query.error as Error).message,
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  const createTransacao = async (transacao: Omit<Transacao, "id" | "user_id" | "created_at" | "updated_at" | "categorias">) => {
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .insert([{ ...transacao, user_id: (await supabase.auth.getUser()).data.user?.id }])
        .select("*, categorias (nome, cor, icone)")
        .single();

      if (error) throw error;
      queryClient.setQueryData<Transacao[]>(queryKeys.transacoes, (prev = []) => [data as Transacao, ...prev]);
      toast({ title: "Transação criada", description: "Transação criada com sucesso!" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Erro ao criar transação", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const updateTransacao = async (id: string, updates: Partial<Transacao>) => {
    try {
      const { data, error } = await supabase
        .from("transacoes")
        .update(updates)
        .eq("id", id)
        .select("*, categorias (nome, cor, icone)")
        .single();

      if (error) throw error;
      queryClient.setQueryData<Transacao[]>(queryKeys.transacoes, (prev = []) =>
        prev.map((item) => (item.id === id ? (data as Transacao) : item)),
      );
      toast({ title: "Transação atualizada", description: "Transação atualizada com sucesso!" });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: "Erro ao atualizar transação", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteTransacao = async (id: string) => {
    try {
      const { error } = await supabase.from("transacoes").delete().eq("id", id);
      if (error) throw error;
      queryClient.setQueryData<Transacao[]>(queryKeys.transacoes, (prev = []) => prev.filter((item) => item.id !== id));
      toast({ title: "Transação removida", description: "Transação removida com sucesso!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro ao remover transação", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const transacoes = query.data || [];

  return {
    transacoes,
    receitas: transacoes.filter((item) => item.tipo === "receita"),
    despesas: transacoes.filter((item) => item.tipo === "despesa"),
    loading: query.isLoading,
    createTransacao,
    updateTransacao,
    deleteTransacao,
    refetch: query.refetch,
  };
};
