
'use server';
import { getFinancialRecommendations } from '@/ai/flows/financial-recommendations';
import {
  FinancialRecommendationsInput,
  FinancialRecommendationsInputSchema,
} from '@/ai/schemas/financial-recommendations';

export async function getRecommendationsAction(
  data: FinancialRecommendationsInput
) {
  const validation = FinancialRecommendationsInputSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.errors
      .map(e => e.message)
      .join(', ');
    return {success: false, error: `Dados inválidos: ${errorMessage}`};
  }

  try {
    const result = await getFinancialRecommendations(validation.data);
    return {success: true, data: result};
  } catch (error) {
    console.error('Erro ao obter recomendações financeiras:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Falha ao obter recomendações da IA. Por favor, tente novamente.';
    return {success: false, error: errorMessage};
  }
}
