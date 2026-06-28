import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  financial: ["financial"] as const,
  transacoes: ["financial", "transacoes"] as const,
  receitas: ["financial", "receitas"] as const,
  despesas: ["financial", "despesas"] as const,
  bankAccounts: ["financial", "bank_accounts"] as const,
  cards: ["financial", "cards"] as const,
  marketQuotes: ["market", "quotes"] as const,
  profile: (userId?: string) => ["profile", userId || "anonymous"] as const,
};
