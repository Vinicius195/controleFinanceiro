import { z } from 'zod';

export const CategoriaSchema = z.object({
  id: z.string().optional(), // O ID será gerado pelo Firestore
  nome: z.string().min(2, "O nome da categoria é obrigatório e precisa ter no mínimo 2 caracteres."),
});

export type Categoria = z.infer<typeof CategoriaSchema>;
