
'use server';
import { getFinancialRecommendations, FinancialRecommendationsInput } from '@/ai/flows/financial-recommendations';
import { z } from 'zod';

const FinancialRecommendationsInputSchema = z.object({
  revenue: z.number().min(0, "A receita deve ser positiva."),
  expenses: z.number().min(0, "As despesas devem ser positivas."),
  ingredientCosts: z.number().min(0, "Os custos com ingredientes devem ser positivos."),
  wageCosts: z.number().min(0, "Os custos com salários devem ser positivos."),
  rentCosts: z.number().min(0, "Os custos com aluguel devem ser positivos."),
  pricingStrategy: z.string().min(1, "A estratégia de preços é obrigatória."),
});

export async function getRecommendationsAction(data: FinancialRecommendationsInput) {
  const validation = FinancialRecommendationsInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Dados inválidos." };
  }

  try {
    const result = await getFinancialRecommendations(validation.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao obter recomendações financeiras:", error);
    return { success: false, error: "Falha ao obter recomendações da IA. Por favor, tente novamente." };
  }
}
