import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

export type MarketQuote = {
  symbol: string;
  label: string;
  type: "currency" | "index" | "commodity" | "crypto";
  currency: string | null;
  value: number;
  previousClose: number | null;
  changePercent: number | null;
  maximumFractionDigits: number | null;
  updatedAt: string;
};

type MarketQuotesResponse = {
  quotes: MarketQuote[];
  errors: string[];
  provider: string;
  fetchedAt: string;
  cacheTtlMs: number;
  cached: boolean;
};

async function fetchMarketQuotes() {
  const response = await fetch("/api/market/quotes");
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Erro ao carregar indicadores de mercado");
  }

  return payload as MarketQuotesResponse;
}

export const useMarketQuotes = () =>
  useQuery({
    queryKey: queryKeys.marketQuotes,
    queryFn: fetchMarketQuotes,
    refetchInterval: 60000,
    staleTime: 55000,
    retry: 1,
  });
