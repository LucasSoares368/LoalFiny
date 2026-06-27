export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericRow = Record<string, any>;
type GenericTable = {
  Row: GenericRow;
  Insert: GenericRow;
  Update: GenericRow;
};

export type Database = {
  public: {
    Tables: {
      profiles: GenericTable;
      categorias: GenericTable;
      categorias_mercado: GenericTable;
      categorias_metas: GenericTable;
      bank_accounts: GenericTable;
      cards: GenericTable;
      transacoes: GenericTable;
      receitas: GenericTable;
      despesas: GenericTable;
      metas: GenericTable;
      itens_mercado: GenericTable;
      orcamentos_mercado: GenericTable;
      veiculos: GenericTable;
      tipos_manutencao: GenericTable;
      manutencoes: GenericTable;
      ia_configuracoes: GenericTable;
      ia_uploads: GenericTable;
      ia_analysis_results: GenericTable;
    };
    Views: Record<string, never>;
    Functions: {
      delete_user_account: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      categoria_tipo: "receita" | "despesa";
    };
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database["public"];

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][EnumName];

export type CompositeTypes<
  CompositeTypeName extends keyof DefaultSchema["CompositeTypes"],
> = DefaultSchema["CompositeTypes"][CompositeTypeName];

export const Constants = {
  public: {
    Enums: {
      categoria_tipo: ["receita", "despesa"],
    },
  },
} as const;
