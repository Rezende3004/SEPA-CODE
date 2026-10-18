import { z } from 'zod';

export const historicoSchema = z.object({
  atividadeId: z.number().int().positive(),
  resultado: z.number().min(0, 'O resultado deve estar entre 0 e 100.').max(100),
  tentativas: z.number().int().min(1, 'Tentativas deve ser pelo menos 1.'),
  tempoRespostaSeg: z.number().min(0),
  feedback: z.string().min(1).max(4000),
  pediuAjuda: z.boolean(),
});

export type DadosHistorico = z.infer<typeof historicoSchema>;
