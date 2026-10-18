import { z } from 'zod';

export const planoSchema = z.object({
  nomePlano: z.string().trim().min(3, 'Informe um nome para o plano.'),
  dataInicio: z.string().min(1, 'Informe a data de início.'),
  objetivos: z.string().trim().min(10, 'Descreva os objetivos com pelo menos 10 caracteres.'),
});

export type DadosPlano = z.infer<typeof planoSchema>;
