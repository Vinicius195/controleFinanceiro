import { z } from 'zod';

export const SocioSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "O nome do sócio é obrigatório."),
  percentualLucro: z.number()
    .min(0, "O percentual não pode ser negativo.")
    .max(100, "O percentual não pode exceder 100.")
    .positive("O percentual deve ser um número positivo."),
});

export type Socio = z.infer<typeof SocioSchema>;
