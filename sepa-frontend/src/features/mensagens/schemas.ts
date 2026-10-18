import { z } from 'zod';

export const mensagemSchema = z.object({
  conteudoTexto: z
    .string()
    .trim()
    .min(1, 'Escreva uma mensagem.')
    .max(4000, 'A mensagem deve ter no máximo 4000 caracteres.'),
});

export type DadosMensagem = z.infer<typeof mensagemSchema>;
