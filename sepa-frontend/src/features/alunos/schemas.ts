import { z } from 'zod';

export const alunoSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo do aluno.'),
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  dataNascimento: z.string().min(1, 'Informe a data de nascimento.'),
  observacoes: z.string().max(4000, 'Use no máximo 4000 caracteres.').optional(),
  responsavelId: z
    .number({ invalid_type_error: 'Selecione o responsável (RN-001).' })
    .int()
    .positive('Selecione o responsável (RN-001).'),
});

export type DadosAluno = z.infer<typeof alunoSchema>;
