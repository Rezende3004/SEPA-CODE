# Relatório da Fase 02 — rascunhos para o Documento de Especificação

Textos prontos para colar nas seções do documento. Ajuste numeração e figuras conforme o
documento final.

---

## Seção 20 — Arquitetura

A arquitetura do SEPA permanece em três camadas, com a camada de apresentação agora
implementada como uma SPA React/TypeScript:

1. **Apresentação (implementada):** SPA em Vite + React 18 responsiva, organizada por
   funcionalidade. Cada feature consome a API por três níveis — `api.ts` (Axios), `hooks.ts`
   (TanStack Query) e componentes/páginas —, sem acesso direto à rede em componentes.
2. **Aplicação (prevista):** Django + Django REST Framework, expondo a API RESTful documentada em
   `docs/api-contract.md` sobre HTTPS com autenticação JWT. As regras RN-001 a RN-004 são
   responsabilidade dessa camada.
3. **Dados (prevista):** PostgreSQL, com o modelo de `schema_sepa.sql` ampliado conforme as
   extensões documentadas (subseção “Modelo de dados” do contrato).

Enquanto a camada de aplicação não existe, o **MSW (Mock Service Worker)** atua como dublê: ele
intercepta as requisições HTTP reais do Axios no _service worker_ do navegador e responde com o
banco em memória. Não há deturpação do fluxo: o frontend realmente chama URLs, envia tokens, trata
401/403/400 e converte respostas DRF.

A troca para o Django é feita **somente por configuração**:

```env
VITE_API_URL=https://api.sepa.exemplo/api
VITE_USE_MOCKS=false
```

Nenhum componente, hook ou tipo precisa mudar. Os contratos de request/response, o formato de erro,
o esquema de tokens (access curto + refresh) e as regras de negócio já estão especificados no
contrato e cobertos por testes dos handlers.

---

## Seção 21 — Tecnologias

| Tecnologia                                      | Versão exata                     | Papel e justificativa                                                                                                                                                       |
| ----------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite                                            | 7.3.7                            | Build e servidor de desenvolvimento; HMR rápido e configuração enxuta.                                                                                                      |
| React                                           | 18.3.1                           | Biblioteca de UI exigida, com `StrictMode` e Suspense.                                                                                                                      |
| TypeScript                                      | 5.9.3                            | Modo `strict`, sem `any`; contratos de API tipados.                                                                                                                         |
| React Router                                    | 6.30.6                           | Rotas por perfil com layouts aninhados e guardas.                                                                                                                           |
| Axios                                           | 1.20.0                           | Instância única com interceptors de token e refresh.                                                                                                                        |
| TanStack Query (React Query)                    | 5.104.4                          | Estado do servidor: cache, loading, erro, polling e invalidação. **Adotado** (antes “a confirmar”) por eliminar estado global manual e já trazer _refetch_ e retry.         |
| Tailwind CSS                                    | 3.4.19                           | Tokens visuais centralizados em `tailwind.config.ts`. **Adotado** pela padronização e por manter a identidade visual consistente entre dashboards densos e a área infantil. |
| React Hook Form                                 | 7.90.0                           | Formulários controlados com baixo número de re-renders.                                                                                                                     |
| Zod                                             | 3.25.76                          | Schemas de validação compartilhados entre formulário e tipos.                                                                                                               |
| Recharts                                        | 2.15.4                           | Curva de aprendizado (linha bruta, média móvel e EWMA).                                                                                                                     |
| MSW                                             | 2.15.0                           | API simulada no browser e nos testes (Node).                                                                                                                                |
| Vitest                                          | 3.2.7                            | Testes unitários e de componente.                                                                                                                                           |
| Testing Library (React/DOM/jest-dom/user-event) | 16.3.3 / 10.4.2 / 7.0.1 / 14.6.8 | Testes orientados ao comportamento e à acessibilidade.                                                                                                                      |
| ESLint + typescript-eslint                      | 9.39.5 / 8.71.2                  | Análise estática, inclusive regras de hooks e de pureza.                                                                                                                    |
| Prettier (+ plugin Tailwind)                    | 3.9.10                           | Formatação e ordenação de classes utilitárias.                                                                                                                              |
| lucide-react                                    | 1.59.0                           | Ícones acessíveis e leves.                                                                                                                                                  |
| clsx + tailwind-merge                           | 2.1.1 / 3.7.0                    | Composição segura de classes.                                                                                                                                               |

Versões fixadas no `package.json` (sem `^` nas dependências principais) para reprodutibilidade da
documentação e do ambiente de avaliação.

---

## Seção 14 — Requisitos Funcionais (status na Fase 02)

| RF                                               | Status                                  | Onde está no código                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-001 — Login e cadastro por perfil             | Implementado no frontend (API simulada) | `features/auth` (`LoginForm`, `RegisterForm`, `AuthProvider`), `app/router/RequireAuth.tsx` e `RequireRole.tsx`; tokens e refresh em `shared/lib/api-client.ts` e `token-store.ts`. |
| RF-002 — Profissional gerencia planos            | Implementado                            | `features/planos` + `features/alunos/pages/AlunoDetailPage.tsx` (criar, editar, excluir com confirmação).                                                                           |
| RF-003 — Associar atividades ao plano            | Implementado                            | `features/planos/components/SeletorAtividades.tsx` e `AtividadesDoPlano.tsx`, com busca e filtro por nível/tipo.                                                                    |
| RF-004 — Registro de histórico                   | Implementado                            | `features/execucao` (motores) → `POST /historico/`; handler em `mocks/handlers/historico.ts`.                                                                                       |
| RF-005 — Relatórios analíticos                   | Implementado                            | `features/relatorios` (KPIs, curva de aprendizado, tabela por atividade, alerta de estagnação) e `shared/lib/stats.ts`.                                                             |
| RF-006 — Responsável visualiza progresso         | Implementado                            | `features/responsavel` com linguagem não técnica (`ProgressoSimplificado`).                                                                                                         |
| RF-007 — Mensagens responsável ↔ profissional    | Implementado                            | `features/mensagens` com polling de 10 s e marcação de leitura.                                                                                                                     |
| RF-008 — Aluno executa atividades + ajuda        | Implementado                            | `features/execucao/components` (`AtividadeAssociacao`, `AtividadeSequencia`, `BotaoAjuda`, `TelaConclusao`) e sons via Web Audio API.                                               |
| RF-009 — Recomendações da IA com explicabilidade | Implementado                            | `features/recomendacoes` (`RecomendacaoCard`, `Explicabilidade`) e handler com RN-004.                                                                                              |
| RF-010 — Administrador                           | Implementado                            | `features/admin` (status de assinatura, contas de profissionais).                                                                                                                   |
| RNF-004 — Acessibilidade e UX do aluno           | Implementado                            | `app/layouts/AlunoLayout.tsx`, `execucao/hooks/use-sensory-preferences.ts`, `shared/styles`, alvos ≥ 48 px, foco visível, `aria-live`, `prefers-reduced-motion`.                    |

**Requisitos de negócio:** RN-001 a RN-004 são aplicados no servidor simulado
(`mocks/lib/rules.ts`) e verificados por `mocks/handlers/rules.test.ts`, além das validações de
formulário.

---

## Seção 16 — Design

### Fluxo de navegação real

**Público:** `/login`, `/cadastro`, `/403`, `*` → 404.

**Profissional:** `/profissional` (visão geral com alertas e recomendações pendentes) →
`/profissional/alunos` → `/profissional/alunos/:alunoId` (dados, planos, atalhos) →
`/profissional/alunos/:alunoId/planos/:planoId` (objetivos e atividades) →
`/profissional/atividades` (catálogo) → `/profissional/relatorios` e
`/profissional/relatorios/:alunoId` → `/profissional/recomendacoes` →
`/profissional/mensagens` e `/profissional/mensagens/:usuarioId`.

**Aluno:** `/aluno` (cards grandes de atividades) → `/aluno/atividades/:atividadeId`
(execução guiada) → `/aluno/preferencias` (painel sensorial).

**Responsável:** `/responsavel` → `/responsavel/filhos/:alunoId` →
`/responsavel/mensagens` e `/responsavel/mensagens/:usuarioId`.

**Administrador:** `/admin` → `/admin/instituicoes` → `/admin/profissionais`.

### Diferenças em relação ao protótipo

- Não havia prints do Figma no repositório de trabalho. A referência visual disponível era o
  gráfico gerado por `iasepa.py` (`docs/design/dashboard-referencia.png`). A identidade visual foi
  personalizada com as quatro cores do projeto — azul `#1F5C8B`, laranja `#E07A2F`, amarelo
  `#F2C14E` e branco `#FFFFFF`.
- A área do aluno adota tokens próprios mais suaves (`kid.*`) para reduzir estímulos, mantendo a
  mesma identidade dos dashboards adultos.
- A curva do relatório reproduz a lógica do protótipo Python (resultado bruto, tendência suavizada
  EWMA e leitura de tendência), mas usa média móvel em vez de Holt-Winters: a projeção estatística
  é responsabilidade do módulo de IA na camada de aplicação.
- O contraste foi ajustado para WCAG 2.1 AA; o protótipo usava cores mais saturadas em alguns
  pontos.

---

## Seção 22.1 — Implementação Frontend

### Funcionalidades implementadas e relação com os RFs

- **Autenticação (RF-001):** login e cadastro com escolha entre Responsável, Pedagogo, Psicólogo e
  Fonoaudiólogo. A sessão fica em um único Context (`AuthProvider`); o access token vive em memória
  e o refresh em `sessionStorage`. O interceptor renova o token uma única vez por 401 e faz logout
  se o refresh falhar.
- **Alunos e planos (RF-002, RF-003):** cadastro de aluno com responsável obrigatório, lista
  filtrável e detalhe com planos. No plano, o profissional edita objetivos e associa atividades do
  catálogo com busca, filtro por tipo e nível.
- **Atividades jogáveis (RF-008):** dois motores reais — associação imagem-palavra e ordenação de
  rotina — com retorno visual e sonoro imediato (Web Audio API), botão grande de ajuda que revela
  dica e registra `pediuAjuda`, e tela de conclusão sem estímulo excessivo.
- **Histórico (RF-004):** cada conclusão envia `POST /historico/` com resultado, tentativas, tempo
  e se houve ajuda; o gráfico e os alertas se atualizam pela invalidação de cache.
- **Relatórios (RF-005):** KPIs (média, tentativas, execuções, pedidos de ajuda, slope), curva por
  atividade com média móvel e EWMA, tabela comparativa e banner de estagnação.
- **Responsável (RF-006):** visão em linguagem simples, com barras de progresso, destaques e
  explicação de que pedir ajuda faz parte do processo.
- **Mensagens (RF-007):** lista de conversas com não lidas, janela de conversa, envio com React Hook
  Form + Zod e polling de 10 segundos via React Query.
- **Recomendações da IA (RF-009):** cards com nível atual → sugerido, atividades afetadas e
  explicabilidade (peso de cada métrica em barras). A decisão é explicitamente humana, com
  confirmação antes de aplicar o nível.
- **Administração (RF-010):** status de assinatura das instituições e gestão de contas de
  profissionais (criar, ativar, desativar).

### Estrutura em camadas (api → hooks → componentes)

```
features/planos/
├── api.ts          # funções que chamam o apiClient (Axios)
├── hooks.ts        # usePlanos, useCriarPlano, ... (React Query + invalidação)
├── schemas.ts      # validação Zod (formulários)
├── components/     # PlanoCard, PlanoFormModal, SeletorAtividades, AtividadesDoPlano
└── pages/          # PlanoDetailPage
```

Nenhum componente importa `apiClient`. As mutações invalidam as chaves de cache afetadas, então
listas e indicadores se mantêm coerentes sem estado global extra.

### Fluxos principais por perfil

1. **Profissional:** entra pelo login → vê indicadores e alunos em atenção → abre um aluno → cria
   ou edita o plano → associa atividades → acompanha o relatório e decide sobre recomendações →
   conversa com o responsável.
2. **Aluno:** entra com o próprio perfil → escolhe uma atividade em card grande → executa com
   feedback imediato → pode pedir ajuda → conclui e o progresso é registrado → ajusta preferências
   sensoriais.
3. **Responsável:** vê o progresso dos filhos em linguagem simples → abre o detalhe → conversa com
   o profissional.
4. **Administrador:** acompanha o panorama → ajusta assinaturas → cria/ativa/desativa profissionais.

### Qualidade

- Testes com Vitest + Testing Library cobrindo funções estatísticas, guarda de rotas por perfil,
  RN-001 no formulário, fluxo de aceite de recomendação, conclusão de atividade gerando histórico,
  login e regras de negócio no servidor simulado.
- Estados de carregamento, erro e vazio em todas as telas com dados.
- `npm run lint`, `npm run test` e `npm run build` passam sem erros.

---

## Seção 23 — Organização do Código e Repositório

### Árvore comentada

```
sepa-frontend/
├── docs/                       # contrato, decisões, relatório e evidências
├── public/mockServiceWorker.js # worker do MSW
├── src/
│   ├── app/                    # bootstrap, providers, router, layouts, navegação
│   ├── features/               # uma pasta por funcionalidade
│   │   ├── auth/  alunos/  planos/  atividades/  execucao/
│   │   ├── relatorios/  recomendacoes/  mensagens/  responsavel/  admin/
│   │   # padrão: api.ts, hooks.ts, schemas.ts, components/, pages/, *.test.tsx
│   ├── shared/
│   │   ├── components/ui/      # Button, Card, Modal, Input, EmptyState, Alert...
│   │   ├── components/         # NivelDificuldade, TendenciaBadge
│   │   ├── hooks/              # useReducedMotion
│   │   ├── lib/                # api-client, query-client, token-store, stats, format, shuffle
│   │   ├── styles/             # tokens.css e globals.css
│   │   ├── test/               # setup, render com providers, servidor MSW de teste
│   │   └── types/              # espelho tipado do modelo de dados
│   └── mocks/                  # db em memória, seed, handlers MSW e libs de apoio
├── .env.example
├── eslint.config.js
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

### Padrões adotados

- **Camadas:** `api.ts` → `hooks.ts` → componentes. Hooks são a única porta de entrada para dados.
- **Cache:** chaves nomeadas por recurso e invalidadas após mutações relacionadas.
- **Estado global:** apenas a sessão usa Context API; preferências sensoriais usam um store com
  `useSyncExternalStore`.
- **Estatística pura:** `shared/lib/stats.ts`, coberta por testes unitários.
- **Tipos:** nenhum `any`; `unknown` é tratado com validação antes do uso.
- **Acessibilidade:** `aria-*`, foco visível, rótulos, `aria-live` para feedback e alvos ≥ 48 px na
  área do aluno.

### Convenções de nomes

- Componentes e páginas em `PascalCase` (`PlanoFormModal.tsx`).
- Hooks no padrão `useAlgo` (`usePlanos`, `useSensoryPreferences`).
- Demais arquivos em `kebab-case` (`api-client.ts`, `use-sensory-preferences.ts`).
- Tipos e interfaces em `PascalCase`, sem prefixo.
- Variáveis, funções e mensagens de interface em português; nomes de API refletem o contrato DRF.

### Estratégia de branches

- `main`: protegida, apenas versões estáveis e apresentáveis; recebe merge via Pull Request.
- `develop`: integração contínua das entregas da fase.
- `feature/<escopo>`: uma branch por funcionalidade (ex.: `feature/relatorios`,
  `feature/execucao-aluno`), com commits pequenos e descritivos.
- Fluxo: `feature/*` → Pull Request para `develop` (revisão + lint/test/build no CI) → Pull Request
  de `develop` para `main` ao fim da fase. Hotfixes usam `fix/*` a partir de `main`.

Nesta entrega acadêmica, o histórico foi feito em `main` com um commit por etapa, para que a
evolução técnica fique evidente na apresentação; a estratégia acima é a adotada no trabalho em
equipe.

### Conventional Commits

Formato `tipo(escopo): descrição no imperativo`, por exemplo:

```
feat(planos): adiciona associacao de atividades ao plano
feat(execucao): implementa atividades jogaveis e registro de historico
feat(recomendacoes): adiciona explicabilidade e aceite do profissional
fix(auth): corrige renovacao de token em requisicoes concorrentes
test(stats): cobre media movel, ewma e classificacao de tendencia
docs: documenta contrato da API e decisoes de projeto
chore(setup): configura Vite, Tailwind e API simulada
```

### Fluxo de Pull Request

1. Criar a branch a partir de `develop`.
2. Implementar com testes e rodar `npm run lint && npm run test && npm run build`.
3. Abrir PR descrevendo: RFs atendidos, prints/evidências e decisões tomadas.
4. Pelo menos uma revisão; ajustes via commits adicionais na mesma branch.
5. Merge com _squash_ ou merge commit, mantendo a mensagem no padrão Conventional Commits.
