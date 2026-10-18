# SEPA Frontend

Frontend do **SEPA — Sistema Educacional Personalizado para Autistas**, Projeto Integrador
(5º período, Fase 02). Plataforma multi-institucional para profissionais criarem planos de
atendimento, atribuírem atividades gamificadas e acompanharem a evolução de crianças com TEA, com
visão da família e recomendações explicáveis de IA.

Enquanto o backend Django REST Framework não existe, a aplicação funciona de ponta a ponta com uma
**API simulada em MSW** que intercepta as chamadas reais do Axios — inclusive tokens, refresh, 401,
403 e validações. A troca para o backend é feita apenas por variável de ambiente.

## Requisitos

- Node.js 20+ (desenvolvido com Node 24)
- npm 10+

## Como rodar

```bash
cd sepa-frontend
npm install
copy .env.example .env   # Windows (no Linux/macOS: cp .env.example .env)
npm run dev
```

Acesse `http://localhost:5173`. O arquivo `.env` é opcional: sem ele, os mocks ficam ativos e a API
aponta para `/api`, mantendo o comportamento de demonstração.

## Usuários de teste

Senha de todos: `Sepa@2026`. Dados 100% fictícios.

| Perfil                        | E-mail                             | O que demonstra                                     |
| ----------------------------- | ---------------------------------- | --------------------------------------------------- |
| Administrador                 | `admin@sepa.exemplo`               | instituições, assinaturas e contas de profissionais |
| Psicóloga (instituição A)     | `ana.psicologa@sepa.exemplo`       | rotina completa do profissional                     |
| Fonoaudiólogo (instituição A) | `bruno.fono@sepa.exemplo`          | planos de Sofia                                     |
| Pedagoga (instituição A)      | `carla.pedagoga@sepa.exemplo`      | planos de Theo                                      |
| Psicólogo (instituição B)     | `diego.psicologo@sepa.exemplo`     | isolamento entre instituições (RN-002)              |
| Responsável (2 filhos)        | `mariana.responsavel@sepa.exemplo` | progresso de Lucas e Helena                         |
| Aluno (evolução)              | `lucas.aluno@sepa.exemplo`         | atividades e preferências sensoriais                |
| Aluno (estagnação)            | `helena.aluno@sepa.exemplo`        | atividade em ritmo de consolidação                  |

O painel de login também preenche as credenciais de demonstração com um clique.

## Scripts

| Script               | Descrição                                      |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento com MSW            |
| `npm run build`      | typecheck (`tsc --noEmit`) + build de produção |
| `npm run preview`    | pré-visualização do build                      |
| `npm run typecheck`  | TypeScript estrito, sem emissão                |
| `npm run lint`       | ESLint (flat config)                           |
| `npm run test`       | Vitest (execução única)                        |
| `npm run test:watch` | Vitest em modo watch                           |
| `npm run format`     | Prettier em todo o projeto                     |

## Desligar os mocks

No `.env`:

```env
VITE_API_URL=https://api.sepa.exemplo/api
VITE_USE_MOCKS=false
```

Nenhum componente muda. Os contratos consumidos estão em
[`docs/api-contract.md`](docs/api-contract.md) e foram desenhados para o Django REST Framework.

## Funcionalidades

| RF      | Implementação                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-001  | Login/cadastro por perfil, rotas protegidas, 403, access em memória + refresh em `sessionStorage`, renovação automática                            |
| RF-002  | Gestão de planos de atendimento (criar, editar, excluir com confirmação)                                                                           |
| RF-003  | Associação de atividades com busca e filtro por tipo/nível                                                                                         |
| RF-004  | Registro de histórico a cada atividade concluída                                                                                                   |
| RF-005  | Relatórios com média, tentativas, slope, curva de aprendizado (bruto + média móvel + EWMA) e alerta de estagnação                                  |
| RF-006  | Visão simplificada do responsável, sem jargão técnico                                                                                              |
| RF-007  | Mensagens com polling de 10 s, não lidas e marcação de leitura                                                                                     |
| RF-008  | Duas atividades jogáveis reais (associação e sequência), ajuda com dica, som via Web Audio API e conclusão positiva                                |
| RF-009  | Recomendações da IA com nível atual → sugerido, explicabilidade por pesos e decisão explícita do profissional                                      |
| RF-010  | Administração de assinaturas e contas de profissionais                                                                                             |
| RNF-004 | Área do aluno com alvos ≥ 48 px, foco visível, `aria-live`, sem timers/estímulos excessivos, `prefers-reduced-motion` e painel sensorial por aluno |

## Stack

React 18.3.1 · TypeScript 5.9.3 · Vite 7.3.7 · React Router 6.30.6 · Axios 1.20.0 ·
TanStack Query 5.104.4 · React Hook Form 7.90.0 · Zod 3.25.76 · Tailwind CSS 3.4.19 ·
Recharts 2.15.4 · MSW 2.15.0 · Vitest 3.2.7 · Testing Library. Versões fixadas no
`package.json`; a justificativa de cada uma está em
[`docs/relatorio-fase02.md`](docs/relatorio-fase02.md) (Seção 21).

## Estrutura

```
src/
├── app/             # App, providers, router, guardas, layouts por perfil
├── features/        # auth, alunos, planos, atividades, execucao, relatorios,
│                    # recomendacoes, mensagens, responsavel, admin
│                    # cada uma com api.ts → hooks.ts → componentes/páginas
├── shared/
│   ├── components/  # UI e componentes reutilizáveis acessíveis
│   ├── hooks/       # hooks genéricos
│   ├── lib/         # apiClient, queryClient, tokenStore, stats, formatação
│   ├── styles/      # tokens e estilos globais
│   ├── test/        # setup, render com providers, MSW de teste
│   └── types/       # espelho tipado do modelo de dados
└── mocks/           # seed, banco em memória e handlers MSW por recurso
```

A árvore comentada completa está em
[`docs/relatorio-fase02.md`](docs/relatorio-fase02.md) (Seção 23).

## Testes

Cobrem, no mínimo:

- funções puras de `shared/lib/stats.ts` (média, média móvel, EWMA, slope, tendência);
- guarda de rotas por perfil (`RequireRole`);
- RN-001 no formulário e no handler de alunos;
- fluxo de aceite de recomendação com aplicação do nível (RN-004);
- conclusão de uma atividade gerando histórico e `pediuAjuda`;
- login com redirecionamento por perfil;
- RN-002, RN-003, RN-004 e mensagens diretamente nos handlers MSW.

```bash
npm run test
```

## Documentação

- [`docs/api-contract.md`](docs/api-contract.md) — contrato completo da API (especificação para o
  backend).
- [`docs/decisoes.md`](docs/decisoes.md) — decisões, extensões de modelo e trade-offs.
- [`docs/relatorio-fase02.md`](docs/relatorio-fase02.md) — rascunhos das Seções 14, 16, 20, 21, 22.1
  e 23 do documento.
- [`docs/evidencias/roteiro.md`](docs/evidencias/roteiro.md) — roteiro numerado de prints por RF.
- [`docs/design/tokens.md`](docs/design/tokens.md) — paleta, tipografia, espaçamento e movimento.

## Privacidade

Todos os nomes, e-mails, telefones, registros profissionais e históricos são fictícios e gerados por
seed determinístico. Nenhum dado real de criança, responsável ou profissional é utilizado.
