import { z } from 'zod';

export const DespesaFixaSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(2, "A descrição é obrigatória."),
  valor: z.number().positive("O valor deve ser positivo."),
  categoria: z.string().min(1, "A categoria é obrigatória."),
  contaPadraoId: z.string().min(1, "A conta padrão é obrigatória."),
  diaVencimento: z.number().min(1).max(31, "O dia deve ser entre 1 e 31.").default(1),
});

export type DespesaFixa = z.infer<typeof DespesaFixaSchema>;
