import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export type DadosLogin = z.infer<typeof loginSchema>;

export const PERFIS_CADASTRO = ['RESPONSAVEL', 'PSICOLOGO', 'FONOAUDIOLOGO', 'PEDAGOGO'] as const;
export type PerfilCadastro = (typeof PERFIS_CADASTRO)[number];

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome completo.'),
    email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmarSenha: z.string().min(1, 'Confirme a senha.'),
    perfil: z.enum(PERFIS_CADASTRO, { errorMap: () => ({ message: 'Selecione o perfil.' }) }),
    instituicaoId: z
      .number({ invalid_type_error: 'Selecione a instituição.' })
      .int()
      .positive('Selecione a instituição.'),
    telefone: z.string().optional(),
    registroProfissional: z.string().optional(),
  })
  .superRefine((dados, contexto) => {
    if (dados.senha !== dados.confirmarSenha) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmarSenha'],
        message: 'As senhas não coincidem.',
      });
    }
    if (dados.perfil === 'RESPONSAVEL' && !dados.telefone?.trim()) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telefone'],
        message: 'Informe o telefone de contato.',
      });
    }
    if (dados.perfil !== 'RESPONSAVEL' && !dados.registroProfissional?.trim()) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registroProfissional'],
        message: 'Informe o registro profissional.',
      });
    }
  });

export type DadosCadastro = z.infer<typeof cadastroSchema>;
