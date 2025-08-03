import { z } from 'zod';

export const ContaBancariaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "O nome da conta é obrigatório."),
  banco: z.string().optional(),
  saldoInicial: z.number().default(0),
  // O saldo atual será gerenciado por meio das transações
});

export type ContaBancaria = z.infer<typeof ContaBancariaSchema>;
