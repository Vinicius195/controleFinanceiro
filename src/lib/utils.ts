import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número para o padrão de moeda brasileira (BRL).
 * @param value O número a ser formatado.
 * @returns A string formatada como moeda (ex: "R$ 1.234,56").
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um número como uma porcentagem.
 * @param value O número a ser formatado (ex: 0.25 para 25%).
 * @returns A string formatada como porcentagem (ex: "25,00%").
 */
export function formatPercentage(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 });
}
