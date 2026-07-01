/// <reference types="vite/client" />

declare module "@edusites/bancos-brasil/core" {
  export function svgBanco(options: {
    nome: string;
    tamanho?: number;
    formato?: "quadrado" | "circulo" | "sem";
    cor?: string;
    fundo?: string;
    className?: string;
  }): string | null;
}
