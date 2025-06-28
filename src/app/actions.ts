
'use server';
import { getFinancialRecommendations, FinancialRecommendationsInput } from '@/ai/flows/financial-recommendations';
import { z } from 'zod';

const FinancialRecommendationsInputSchema = z.object({
  revenue: z.number().min(0, "Revenue must be positive."),
  expenses: z.number().min(0, "Expenses must be positive."),
  ingredientCosts: z.number().min(0, "Ingredient costs must be positive."),
  wageCosts: z.number().min(0, "Wage costs must be positive."),
  rentCosts: z.number().min(0, "Rent costs must be positive."),
  pricingStrategy: z.string().min(1, "Pricing strategy is required."),
});

export async function getRecommendationsAction(data: FinancialRecommendationsInput) {
  const validation = FinancialRecommendationsInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input." };
  }

  try {
    const result = await getFinancialRecommendations(validation.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting financial recommendations:", error);
    return { success: false, error: "Failed to get recommendations from AI. Please try again." };
  }
}
