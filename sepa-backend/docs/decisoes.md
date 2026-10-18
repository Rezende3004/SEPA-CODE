# Decisões do backend SEPA

Registro das decisões tomadas na implementação, com foco nas divergências entre o contrato
documentado, os handlers MSW do frontend e os requisitos do backend.

## 1. Contrato extraído

A fonte de verdade foi `sepa-frontend/docs/api-contract.md` + `src/mocks/handlers/*`, conferidos
contra `src/shared/types` e `src/mocks/seed.ts`. Resumo:

| Área | Endpoints |
|---|---|
| Auth | `POST /auth/login/`, `POST /auth/refresh/`, `POST /auth/register/`, `GET /me/` |
| Instituições | `GET /instituicoes/`; `GET/PATCH /admin/instituicoes/` |
| Alunos | `GET/POST /alunos/`, `GET /alunos/:id/`, `GET /responsaveis/` |
| Atividades | `GET /atividades/`, `GET /aluno/atividades/` |
| Histórico | `POST /historico/` |
| Planos | `GET/POST /planos/`, `GET/PATCH/DELETE /planos/:id/`, `POST/DELETE` associações |
| Relatórios | `GET /relatorios/desempenho/` |
| IA | `GET /recomendacoes/`, `GET /recomendacoes/:id/`, `POST .../aceitar/`, `.../rejeitar/` |
| Mensagens | `GET/POST /mensagens/`, `POST /mensagens/:id/lida/`, `GET /usuarios/:id/` |
| Admin | `GET/POST/PATCH /admin/profissionais/` |

Convenções mantidas: JSON camelCase, rotas com barra final, listas como arrays (sem paginação),
erros DRF (`{campo: [...]}` ou `{detail}`), tokens Bearer, IDs numéricos e datas ISO.

## 2. Divergências encontradas e resolução

| # | Ponto | Situação | Decisão |
|---|---|---|---|
| 1 | Refresh rotacionado | O mock devolve só `access`, mas SimpleJWT com rotação devolve também um novo `refresh`; o frontend antigo ignorava esse valor e o refresh antigo é blacklistado. | Mantivemos rotação + blacklist e corrigimos o frontend para salvar o novo refresh em `tokenStore`. Bug real do frontend, documentado também lá. |
| 2 | Escopo de mensagens | Mock valida apenas a mesma instituição; a task exige profissional e responsável que compartilham pelo menos um aluno. | Implementado o vínculo `Aluno.responsavel` + `Plano.profissional`; mensagens fora do vínculo → 403. Mais restritivo e adequado à LGPD. |
| 3 | Histórico | Mock valida a instituição da atividade; a task exige que ela esteja em um plano do aluno. | `execucao/services.py` valida `Contem`; atividade solta → 400. |
| 4 | Aceite de recomendação | Mock altera `Atividade.nivel_dificuldade` das atividades sugeridas; a task sugere `Contem.nivel_atribuido` caso o contrato não defina. | O contrato define o efeito; seguimos o mock: nível da atividade é atualizado dentro de transação, com `decidido_por`, `decidido_em` e auditoria. `nivel_atribuido` fica como evolução futura. |
| 5 | Relatório para aluno | O contrato lista ADMIN/PROFISSIONAL/RESPONSAVEL; o handler permite também ALUNO para o próprio registro. | Mantido o comportamento do handler; a verificação é a mesma `can_view_aluno`, sem expor dados de terceiros. |
| 6 | `GET /recomendacoes/:id/` | Existe no handler, não estava documentado. | Implementado. |
| 7 | Minimização | O mock envia `observacoes` para todos. | Responsável recebe `observacoes: null`; aluno não recebe anotações clínicas em `/me` nem nas atividades. `observacoes_ia` só aparece para profissional/admin via análise/recomendação. |
| 8 | `Atividade.itens` | O SQL original só tem mídia; o frontend precisa de itens jogáveis. | Criado o modelo `ItemAtividade` (FK, ordem, tipo, valor, rótulo, dica); `conteudoIds` vem do through `Utiliza`. |
| 9 | `ativo` | O Django usa `is_active`; o camel-case geraria `isActive`. | Serializers expõem explicitamente `ativo` com `source="is_active"`. |
| 10 | Sem paginação | O frontend espera arrays. | `DEFAULT_PAGINATION_CLASS=None`. |
| 11 | Seed | O seed TypeScript tem IDs fixos usados nas evidências. | `seed_demo` cria IDs explícitos (usuários 1–16, atividades 1–15, planos 1–6 etc.) e reseta sequences no PostgreSQL. |
| 12 | Login | SimpleJWT usa `authenticate(username=...)` e devolve 401 para usuário inativo. | View customizada busca por e-mail, valida a senha, retorna 403 diferenciado para conta inativa/instituição suspensa e inclui `usuario` no corpo. |
| 13 | OpenAPI | APIViews não têm serializer automaticamente. | Adicionados `@extend_schema` e hook oficial do camel-case; schema gerado sem erros e sem avisos. |
| 14 | Banco em testes | O ambiente local não tem PostgreSQL em todos os momentos. | `test.py` usa SQLite quando `DATABASE_URL` não está definido; CI e Docker usam PostgreSQL 16. Produção exige `DATABASE_URL`. |

## 3. Modelo e segurança

- `Usuario` é `AUTH_USER_MODEL`, login por e-mail, `tipo_usuario` e `instituicao` (nullable apenas
  para administrador).
- `Profissional`, `Responsavel` e `Aluno` usam `OneToOneField(primary_key=True, on_delete=CASCADE)`.
- `Aluno.responsavel` é `NOT NULL` (`PROTECT`) e há validação no service, serializer e banco (RN-001).
- `HistoricoAtividade` tem `CheckConstraint` para resultado 0–100 e tentativas ≥ 1, índices por
  aluno/data e aluno/atividade/data.
- `RecomendacaoIA` tem `nivel_atual`, `nivel_sugerido` (1–5), `fatores` JSON, `decidido_por` e
  `decidido_em`; as atividades são N:N via `Sugere`.
- `Mensagem` tem remetente, destinatário, `lida` e constraint que impede mensagem para si mesmo.
- `Auditoria` registra usuário, ação, objeto, detalhes, IP e user-agent. Admin é somente leitura.

## 4. Autorização

- `common/permissions.py` concentra `is_*`, `can_view_aluno`, `can_manage_aluno`,
  `can_decide_recomendacao` e classes de permissão.
- `common/mixins.py` concentra o recorte de querysets por perfil/instituição.
- Objetos de outra instituição retornam **403** (contrato), não 404.
- Listagens não confiam em `instituicaoId` do cliente; o valor é sempre derivado do token.

## 5. IA

- Features: média de resultados, tentativas médias, tempo médio, taxa de pedidos de ajuda e slope.
- Treino com XGBoost multiclasse (diminuir/manter/aumentar) em dados sintéticos anonimizados.
  Métricas impressas no comando e salvas em `ml/modelo_sepa.json`.
- Explicabilidade via `pred_contribs=True`; os pesos são normalizados para 1 e exibidos como
  `fatores`.
- Se o artefato não existir, o serviço usa heurística de fallback; o seed e o comando de treino
  geram o modelo. Nenhuma recomendação altera plano/atividade sem `aceitar/`.
- Sem filas assíncronas nesta fase.

## 6. Extra

- Adicionado `POST /auth/logout/` para blacklist do refresh (o frontend ainda pode apenas limpar a
  sessão local, mas o endpoint está disponível para o 6º período).
- Adicionado `POST /ia/analisar/?aluno=:id` como extensão backend-only para gerar análise e
  recomendação sob demanda; o frontend continua lendo `/recomendacoes/`.
- OpenAPI/Swagger em `/api/schema/` e `/api/docs/`.
