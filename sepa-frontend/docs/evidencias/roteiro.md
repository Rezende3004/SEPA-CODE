# Roteiro de evidências (prints) — Fase 02

Sugestão de captura em ordem, para comprovar o funcionamento de cada RF. Use dados fictícios do
seed (senha `Sepa@2026`). Antes de começar: `cd sepa-frontend && npm install && npm run dev`.

| #   | Print                                                         | Perfil                             | Rota                                     | O que deve aparecer                                                             | Evidencia       |
| --- | ------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- | --------------- |
| 1   | Terminal com `npm run lint`, `npm run test` e `npm run build` | —                                  | —                                        | Todos os comandos sem erros; resumo dos testes                                  | Qualidade       |
| 2   | Tela de login com contas de demonstração                      | Público                            | `/login`                                 | Cartões de contas fictícias e formulário vazio                                  | RF-001          |
| 3   | Cadastro com escolha de perfil                                | Público                            | `/cadastro`                              | Quatro perfis, campos condicionais (telefone/registro) e seleção de instituição | RF-001          |
| 4   | Acesso indevido                                               | Profissional                       | `/admin` (digitado na URL)               | Página 403 explicando que a área não é do perfil                                | RF-001          |
| 5   | Painel do profissional                                        | `ana.psicologa@sepa.exemplo`       | `/profissional`                          | Indicadores, bloco de estagnação e grade de alunos                              | RF-002 / RF-005 |
| 6   | Lista de alunos com busca                                     | Profissional                       | `/profissional/alunos`                   | Tabela com responsável, média, tendência e nº de planos                         | RF-002          |
| 7   | Detalhe do aluno                                              | Profissional                       | `/profissional/alunos/11`                | Idade, responsável, média, tendência, observações e planos                      | RF-002          |
| 8   | Cadastro de aluno sem responsável                             | Profissional                       | modal “Novo aluno”                       | Mensagem de erro do responsável e envio bloqueado (RN-001)                      | RF-002 / RN-001 |
| 9   | Criação de plano                                              | Profissional                       | `/profissional/alunos/11` → “Novo plano” | Modal com nome, data de início e objetivos                                      | RF-002          |
| 10  | Plano com atividades                                          | Profissional                       | `/profissional/alunos/11/planos/1`       | Objetivos, lista de atividades e botões remover                                 | RF-002 / RF-003 |
| 11  | Seletor de atividades                                         | Profissional                       | mesmo plano → “Adicionar atividades”     | Modal com busca, filtro por tipo/nível e seleção múltipla                       | RF-003          |
| 12  | Exclusão de plano                                             | Profissional                       | mesmo plano → “Excluir”                  | Diálogo de confirmação                                                          | RF-002          |
| 13  | Catálogo da instituição                                       | Profissional                       | `/profissional/atividades`               | 10 atividades da instituição A, com níveis e tipos                              | RF-003 / RN-003 |
| 14  | Home do aluno                                                 | `lucas.aluno@sepa.exemplo`         | `/aluno`                                 | Cards grandes com atividades atribuídas                                         | RF-008          |
| 15  | Associação imagem-palavra                                     | Aluno                              | `/aluno/atividades/1`                    | Emoji, quatro opções e feedback imediato; pedir ajuda revela dica               | RF-008          |
| 16  | Dica visível por “Preciso de ajuda”                           | Aluno                              | mesma rota                               | Faixa com a dica e aviso de que ajuda não tira pontos                           | RF-008          |
| 17  | Sequência de rotina                                           | Aluno                              | `/aluno/atividades/9`                    | Passos embaralhados e lista “Sua ordem”                                         | RF-008          |
| 18  | Conclusão da atividade                                        | Aluno                              | após concluir                            | Estrelas, resultado, tentativas e aviso de progresso registrado                 | RF-008 / RF-004 |
| 19  | Preferências sensoriais                                       | Aluno                              | `/aluno/preferencias`                    | Som, volume, animações e tamanho do texto                                       | RNF-004         |
| 20  | Preferência aplicada                                          | Aluno                              | `/aluno` com “muito grande”              | Texto ampliado e animações desligadas                                           | RNF-004         |
| 21  | Relatório do aluno (evolução)                                 | Profissional                       | `/profissional/relatorios/11`            | KPIs, curva de aprendizado e tabela por atividade                               | RF-005          |
| 22  | Alerta de estagnação                                          | Profissional                       | `/profissional/relatorios/12`            | Banner de estagnação e média abaixo do esperado                                 | RF-005          |
| 23  | Visão do responsável                                          | `mariana.responsavel@sepa.exemplo` | `/responsavel`                           | Cards com linguagem simples e barra de progresso                                | RF-006          |
| 24  | Detalhe do filho                                              | Responsável                        | `/responsavel/filhos/11`                 | Destaques, o que está sendo praticado e botão de mensagem                       | RF-006          |
| 25  | Recomendações da IA                                           | Profissional                       | `/profissional/recomendacoes`            | Nível atual → sugerido, fatores com peso e aviso de decisão humana              | RF-009 / RN-004 |
| 26  | Confirmação do aceite                                         | Profissional                       | modal no card                            | Texto explicitando o nível que será aplicado                                    | RF-009          |
| 27  | Recomendação aceita                                           | Profissional                       | após confirmar                           | Mensagem de sucesso; card migra para “Histórico”                                | RF-009          |
| 28  | Mensagens do profissional                                     | Profissional                       | `/profissional/mensagens`                | Lista de conversas com contador de não lidas                                    | RF-007          |
| 29  | Conversa e envio                                              | Profissional                       | `/profissional/mensagens/6`              | Histórico, campo de escrita e mensagem enviada                                  | RF-007          |
| 30  | Administração                                                 | `admin@sepa.exemplo`               | `/admin`                                 | Indicadores de instituições e profissionais                                     | RF-010          |
| 31  | Assinaturas                                                   | Admin                              | `/admin/instituicoes`                    | Seleção de status por instituição e confirmação visual                          | RF-010          |
| 32  | Contas de profissionais                                       | Admin                              | `/admin/profissionais`                   | Lista, botão ativar/desativar e modal de nova conta                             | RF-010          |
| 33  | Conta desativada                                              | Admin                              | após desativar                           | Profissional marcado como “Desativado”                                          | RF-010          |
| 34  | Mocks desligados                                              | —                                  | `.env` com `VITE_USE_MOCKS=false`        | Aplicação sem o worker; erro de rede esperado até o backend existir             | Arquitetura     |

## Dicas de captura

- Use a janela em 1280 px de largura para os dashboards e uma captura extra em ~420 px para a área
  do aluno, evidenciando o layout acessível.
- Ao capturar a atividade do aluno, mostre a opção correta em verde e depois o erro em vermelho.
- No relatório, destaque a legenda do gráfico: resultado bruto, média móvel (3) e EWMA.
- Para a RN-002 (isolamento), faça um print do `403` ao abrir um aluno de outra instituição com o
  usuário `diego.psicologo@sepa.exemplo`.
- Guarde os prints em `docs/evidencias/` com o número correspondente (`01-lint-test-build.png`,
  `02-login.png`, ...).
