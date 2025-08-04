import { z } from 'zod';

export const SalarioSchema = z.object({
  id: z.string().optional(),
  nomeFuncionario: z.string().min(1, "O nome do funcionário é obrigatório."),
  valor: z.number().min(0.01, "O valor do salário deve ser maior que zero."),
  diaPagamento: z.number().min(1).max(31, "O dia de pagamento deve ser entre 1 e 31."),
  contaDebitoId: z.string().min(1, "A conta de débito é obrigatória."),
  createdAt: z.any().optional(),
});

export type Salario = z.infer<typeof SalarioSchema>;
