import { z } from 'zod';

export const MovimentacaoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string().min(1, "A descrição é obrigatória."),
  valor: z.number().positive("O valor deve ser positivo."),
  data: z.date(),
  categoria: z.string().min(1, "A categoria é obrigatória."),
  
  // Novo campo para associar a uma conta bancária
  contaId: z.string().min(1, "A conta bancária é obrigatória."),

  metodoPagamento: z.string().optional(),
});

export type Movimentacao = z.infer<typeof MovimentacaoSchema>;
