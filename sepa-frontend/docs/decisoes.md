# Decisões de projeto — SEPA Frontend

Registro das decisões tomadas durante a implementação, com a justificativa e o impacto
para o backend do 6º período. Itens marcados como **extensão** não existiam no documento
original e foram necessários para fechar um requisito funcional.

## 1. Organização do repositório

- O frontend vive em `sepa-frontend/`, dentro do repositório do Projeto Integrador.
- `schema_sepa.sql` e `iasepa.py` foram mantidos intactos na raiz: são artefatos das fases
  anteriores e servem de referência para o backend e para o motor de IA.
- O repositório usa `main` como linha principal nesta entrega acadêmica. A estratégia
  documentada para o trabalho em equipe é `main` protegida + `develop` + `feature/*`.

## 2. Camadas e fluxo de dados

```
componente → features/x/hooks.ts (React Query) → features/x/api.ts (Axios) → API
```

- Nenhum componente importa `apiClient` diretamente.
- O único Context React do app é o de sessão (`AuthProvider`). Preferências sensoriais,
  por serem um store local simples, usam `useSyncExternalStore`.
- Chaves de cache do React Query ficam nos `hooks.ts` de cada feature e são invalidadas
  após mutações.

## 3. Autenticação

- Access token em memória (`token-store.ts`); refresh token em `sessionStorage`.
- O boot tenta renovar a sessão com o refresh salvo; se falhar, volta ao login.
- Interceptor Axios: em 401 tenta o refresh **uma única vez** (requisições concorrentes
  compartilham a mesma promessa) e, se falhar, limpa a sessão e emite
  `sepa:session-expired`.
- No mock, o access expira em **120 segundos** e o refresh em 8 horas, para que o fluxo de
  renovação seja realmente exercitado.
- `RequireRole` renderiza a página 403 para acesso indevido; `RequireAuth` redireciona
  usuários anônimos ao login preservando a rota de origem.

## 4. API simulada (MSW)

- `db.ts` mantém o “banco” em memória; `resetDb()` é usado entre testes.
- O seed é determinístico (PRNG mulberry32) e relativo à data de execução, para que os
  gráficos das últimas oito semanas nunca fiquem vazios.
- Regras de negócio são aplicadas nos handlers, não na interface:
  - RN-001: aluno sem responsável → `400` com erro no campo `responsavelId`.
  - RN-002: profissional de outra instituição → `403`.
  - RN-003: atividades e conteúdos filtrados pela instituição da sessão.
  - RN-004: apenas `POST /recomendacoes/:id/aceitar/` de um profissional aplica o nível;
    a recomendação nunca altera o plano sozinha.
- Atraso artificial de 220 ms no browser (0 ms nos testes) para exercitar loading.
- `VITE_USE_MOCKS=false` desliga o worker; `VITE_API_URL` aponta para o Django. Nenhum
  componente muda.

## 5. Extensões de contrato (documentadas para o backend)

| Extensão                                                           | Motivo                                                                                                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Usuario.ativo`                                                    | RF-010 exige ativar/desativar contas de profissionais.                                                                                                   |
| `Usuario.instituicaoId` aceita `null`                              | Administrador da plataforma não pertence a uma instituição.                                                                                              |
| `Atividade.itens: ItemAtividade[]`                                 | O schema guarda apenas mídia; os dois motores jogáveis precisam do conteúdo (emoji, rótulo, dica). Sugestão para o Django: JSONField ou tabela de itens. |
| `GET /api/responsaveis/`                                           | Formulário de aluno precisa listar responsáveis da instituição.                                                                                          |
| `GET /api/instituicoes/` (público)                                 | Cadastro precisa escolher a instituição ativa.                                                                                                           |
| `POST /api/mensagens/:id/lida/`                                    | Contrato original não previa marcação de leitura.                                                                                                        |
| `AlunoResumo.mediaRecente/tendencia`                               | Dashboard do profissional exibe alertas sem N+1 de relatórios.                                                                                           |
| `/api/alunos/` para RESPONSAVEL                                    | Retorna apenas os filhos vinculados ao responsável.                                                                                                      |
| `GET /api/planos/` inclui nomes e atividades                       | Evita múltiplas chamadas na tela de plano.                                                                                                               |
| `/api/relatorios/desempenho/` retorna resumo + série por atividade | Um único payload para KPIs, gráfico e alerta.                                                                                                            |

## 6. Atividades jogáveis

- Dois motores reais:
  - `ASSOCIACAO`: emoji → escolha da palavra correta entre quatro opções.
  - `SEQUENCIA`: ordenação de passos de uma rotina.
- Resultado = desempenho na atividade (0–100). Cada erro incrementa `tentativas`.
- “Preciso de ajuda” revela uma dica, conta `pediuAjuda` e não pune o resultado.
- Ao concluir, `POST /api/historico/` envia resultado, tentativas, tempo de resposta,
  feedback e `pediuAjuda`.
- Sem cronômetros visíveis, sem animações em loop e sem estímulos piscantes.

## 7. Preferências sensoriais

- Salvas por aluno em `localStorage` (`sepa:prefs:<alunoId>`): som, volume, animações e
  tamanho de fonte.
- `prefers-reduced-motion` sempre prevalece sobre a preferência salva.
- O tamanho de fonte altera `--sepa-font-scale` no elemento raiz, aproveitando as unidades
  `rem` do Tailwind.
- O backend do 6º período pode substituir o armazenamento local por um endpoint sem
  alterar os componentes (basta trocar o store).

## 8. Estatística e IA

- `shared/lib/stats.ts` contém funções puras: média, média móvel progressiva, EWMA
  (`span=3`, como no protótipo `iasepa.py`), slope por regressão linear, desvio padrão e
  classificação de tendência.
- Tendência: slope ≥ 1 ponto/sessão → `EVOLUCAO`; ≤ −1 → `REGRESSAO`; caso contrário,
  `ESTAGNACAO`. Os limiares estão documentados e testados.
- O frontend **não treina** XGBoost/Holt-Winters. Ele exibe a análise já produzida pelo
  módulo de IA (no mock, o seed gera análises e fatores de explicabilidade coerentes com o
  histórico). A explicabilidade mostra os fatores e pesos que embasaram a sugestão.
- A decisão final é sempre humana (RN-004), reforçada visualmente na tela.

## 9. Design e acessibilidade

- Não havia prints do Figma no repositório, apenas o gráfico do protótipo Python. A paleta
  foi derivada dele (azul `#2A6F97`, areia `#F4A261`, coral `#E76F51`) e validada para
  contraste AA.
- Tokens centralizados em `tailwind.config.ts` (cores, raios, sombras, tipografia) e
  `shared/styles/tokens.css` (escala de fonte e alvo de toque).
- Alvos de toque ≥ 48 px no painel do aluno; foco visível de 3–4 px; navegação completa
  por teclado; `aria-live` para feedback; textos alternativos e `aria-label` em ícones.
- Sem dark mode nesta fase para não comprometer o contraste validado.

## 10. Outras escolhas

- Listas sem paginação: o volume do seed é pequeno e o contrato prioriza simplicidade.
  O backend pode introduzir paginação DRF sem mudar as telas, desde que preserve o formato
  de lista.
- Datas em ISO 8601; IDs numéricos, espelhando o schema SQL.
- Erros seguem o formato DRF (`detail` ou `{ campo: ["mensagem"] }`).
- Toasts foram evitados: o Context API é exclusivo da sessão, então o feedback é inline com
  `Alert` e `aria-live`.

## 11. Revisão final (etapa 8)

- **Aceite de recomendação:** ao aceitar, o mock altera `nivelDificuldade` das atividades sugeridas
  para `nivelSugerido` (clamp 1–5) e registra o status `ACEITA`. O backend do 6º período deve
  reproduzir esse efeito e, idealmente, manter trilha de auditoria de quem aceitou e quando.
- **Assinatura suspensa:** login de usuários vinculados a uma instituição `SUSPENSA` é bloqueado
  com `403`, e novos cadastros também. O administrador pode reativar em `/admin/instituicoes`.
- **Mensagens:** a lista completa (sem `?com=`) alimenta a lista de conversas; o frontend agrupa por
  contraparte. A marcação de leitura é feita por mensagem no endpoint `POST /mensagens/:id/lida/`.
- **Bundle:** o build separa `react-vendor`, `data-vendor` e `charts-vendor`, além do chunk do MSW
  carregado sob demanda, para não penalizar o carregamento inicial.
- **Testes:** além dos fluxos de UI, os handlers MSW são testados diretamente para RN-001 a RN-004 e
  mensagens, garantindo que as regras vivam no “servidor” simulado.
- **Acessibilidade:** a hierarquia de títulos foi revisada (um `h1` por página, seções em `h2`),
  formulários ligam erros por `aria-describedby`, ícones decorativos usam `aria-hidden`, e o foco é
  visível em todos os controles.
- **Sem Figma:** a referência visual foi o gráfico do protótipo Python; essa limitação está
  registrada na Seção 16 do relatório.

## 12. Integração com o backend Django (Fase 02)

- O frontend passa a consumir a API real apenas com `VITE_USE_MOCKS=false` e `VITE_API_URL=/api`.
- Em desenvolvimento, o Vite faz proxy de `/api` para `http://localhost:8000`; em produção,
  configure `VITE_API_URL` e `CORS_ALLOWED_ORIGINS` no backend.
- **Correção real no frontend:** o mock antigo devolvia apenas `access` no refresh, mas o backend
  usa SimpleJWT com rotação e blacklist e devolve também um novo `refresh`. O `api-client` e o
  `recuperarSessao` agora persistem `data.refresh` em `sessionStorage`; sem isso, o segundo refresh
  usaria um token blacklistado e derrubaria a sessão.
- Contratos verificados no backend: listas sem paginação, JSON camelCase, erros DRF, `403` para
  acesso entre instituições, `409` para recomendação já decidida e `201` para cadastros/execuções.
- A integração foi validada pelo teste de fumaça em
  `sepa-backend/apps/usuarios/tests/test_smoke.py` e por requisições através do proxy do Vite.

## 13. Correções de contrato da revisão

- Cadastro público de **profissional** retorna `{ usuario, pendente: true, detail }` sem tokens e
  com `ativo=false`; o formulário mostra “aguardando ativação” e não redireciona ao painel.
- O nível efetivo de uma atividade agora é `Contem.nivel_atribuido`: o aluno recebe
  `nivelAtribuido` em `/aluno/atividades/`, e o plano usa esse valor em `nivelDificuldade`.
  O aceite de recomendação não altera mais o catálogo, apenas os planos do aluno.
- O mock MSW foi ajustado para simular `niveisAtribuidos` por plano, mantendo os testes alinhados
  ao backend.
- Login e conta inativa retornam o mesmo 401 genérico; o frontend exibe a mensagem do `detail`.
