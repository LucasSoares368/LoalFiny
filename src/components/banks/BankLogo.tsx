import { svgBanco } from "@edusites/bancos-brasil/core";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BankLogoProps {
  name: string;
  size?: number;
  className?: string;
  formato?: "quadrado" | "circulo" | "sem";
  cor?: string;
  fundo?: string;
}

export const BankLogo = ({
  name,
  size = 40,
  className,
  formato,
  cor,
  fundo,
}: BankLogoProps) => {
  const svg = useMemo(() => {
    if (!name) return "";
    
    // Mapeamento de slugs legados ou alternativos
    const slugMap: Record<string, string> = {
      "banco-do-brasil": "bancodobrasil",
      "c6-bank": "c6",
      "bb": "bancodobrasil",
      "itau": "itau",
      "nubank": "nubank",
    };

    const targetSlug = slugMap[name.toLowerCase()] || name.toLowerCase();

    try {
      return (
        svgBanco({
          nome: targetSlug,
          tamanho: size,
          formato,
          cor,
          fundo,
        }) || ""
      );
    } catch (error) {
      console.error("Erro ao renderizar logo do banco:", error);
      return "";
    }
  }, [name, size, formato, cor, fundo]);

  if (!svg) return null;

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden shrink-0", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
