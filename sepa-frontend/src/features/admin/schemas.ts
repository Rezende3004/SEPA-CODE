import { z } from 'zod';
import { ESPECIALIDADES } from '@/shared/types';

export const profissionalAdminSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo.'),
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  especialidade: z.enum(ESPECIALIDADES, {
    errorMap: () => ({ message: 'Selecione a especialidade.' }),
  }),
  registroProfissional: z.string().trim().min(3, 'Informe o registro profissional.'),
  instituicaoId: z
    .number({ invalid_type_error: 'Selecione a instituição.' })
    .int()
    .positive('Selecione a instituição.'),
});

export type DadosProfissionalAdmin = z.infer<typeof profissionalAdminSchema>;
