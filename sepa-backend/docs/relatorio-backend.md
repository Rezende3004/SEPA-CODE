# Relatório Backend — rascunhos para o Documento de Especificação

Textos prontos para as seções 14, 18, 20, 21, 22.2, 22.3, 23 e 25. Métricas e comandos foram
executados no ambiente de desenvolvimento (Python 3.12, Django 5.2.18).

---

## Seção 22.2 — Backend

O backend foi implementado em Django 5 + Django REST Framework, com apps separados por domínio e
regras de negócio em serviços:

| App | Responsabilidade |
|---|---|
| `usuarios` | custom user, perfis 1:1, autenticação JWT, cadastro, `/me`, alunos e responsáveis |
| `instituicoes` | instituições, cadastro público e status de assinatura (admin) |
| `atividades` | catálogo, conteúdos multimídia, itens jogáveis e escopo por instituição |
| `planos` | planos de atendimento e associação N:N com atividades |
| `execucao` | histórico de execução e validação de atividade atribuída |
| `relatorios` | estatística e relatório de desempenho |
| `ia` | features, treinamento XGBoost, análises, recomendações e explicabilidade |
| `mensagens` | conversas profissional ↔ responsável com vínculo de aluno |
| `common` | permissões, mixins de escopo, exceções, auditoria e schema |

### Endpoints por RF

| RF | Backend |
|---|---|
| RF-001 | `POST /auth/login/`, `POST /auth/refresh/`, `POST /auth/register/`, `GET /me/`, `POST /auth/logout/` |
| RF-002 | `/api/alunos/` (GET/POST), `/api/alunos/:id/`, `/api/planos/` (GET/POST/PATCH/DELETE) |
| RF-003 | `/api/planos/:id/atividades/` (POST/DELETE), `/api/atividades/` |
| RF-004 | `POST /api/historico/` |
| RF-005 | `GET /api/relatorios/desempenho/` |
| RF-006 | `GET /api/alunos/` (escopo responsável), `GET /api/relatorios/desempenho/` |
| RF-007 | `GET/POST /api/mensagens/`, `POST /api/mensagens/:id/lida/` |
| RF-008 | `GET /api/aluno/atividades/`, `POST /api/historico/` |
| RF-009 | `/api/recomendacoes/`, `.../aceitar/`, `.../rejeitar/`, `POST /api/ia/analisar/` |
| RF-010 | `/api/admin/instituicoes/`, `/api/admin/profissionais/` |

### RBAC e escopo por instituição

- `common/permissions.py` define as permissões por `tipo_usuario` e as funções de verificação de
  aluno/plano/recomendação.
- `common/mixins.py` aplica o recorte de querysets:
  - administrador: todos os registros;
  - profissional: registros da própria instituição;
  - responsável: somente filhos vinculados;
  - aluno: somente o próprio registro.
- O `instituicao_id` nunca vem do cliente; é derivado do token e usado para preencher o servidor.
- Acesso cruzado retorna 403, mantendo o contrato do frontend.
- Objetos de recomendação e relatório também passam pela mesma checagem de escopo.

### Módulo de IA

- `apps/ia/features.py` extrai cinco features por aluno/atividade: média de resultados, tentativas
  médias, tempo médio de resposta, taxa de pedidos de ajuda e slope.
- O treino usa dados sintéticos gerados a partir dessas features, sem identificadores pessoais, com
  três classes: diminuir, manter e aumentar nível.
- `python manage.py treinar_modelo` treina um `XGBClassifier` (180 estimadores, profundidade 3) e
  imprime acurácia e matriz de confusão. A execução de referência obteve **acurácia de 85,56%** e
  matriz `[[188, 12, 0], [15, 75, 10], [0, 15, 45]]`; os valores podem variar levemente conforme a
  versão das bibliotecas.
- O modelo e o metadata (features, classes, acurácia, matriz, data) são salvos em `ml/`.
- A explicabilidade usa `pred_contribs=True` do XGBoost; as contribuições absolutas são normalizadas
  para pesos que somam 1 e persistidas em `RecomendacaoIA.fatores`.
- `analisar_aluno` cria `AnaliseAprendizado` (pontuação, tendência) e `RecomendacaoIA` (nível atual,
  nível sugerido, fatores, atividades sugeridas). A decisão é exclusivamente humana (RN-004):
  `aceitar/` registra `decidido_por`/`decidido_em` e aplica o nível; `rejeitar/` não altera nada.
- Se o artefato ainda não existir, o serviço usa uma heurística de fallback; o seed e o comando de
  treino geram o `.joblib`.

---

## Seção 22.3 — Integração frontend ↔ backend

O frontend deixou de usar o MSW trocando apenas configuração:

```env
VITE_USE_MOCKS=false
VITE_API_URL=/api
```

Em desenvolvimento, o `vite.config.ts` faz proxy de `/api` para `http://localhost:8000`; em
produção, basta apontar `VITE_API_URL` para a API e configurar `CORS_ALLOWED_ORIGINS`.

Problemas encontrados e correções:

1. **Refresh rotacionado:** o mock devolvia somente `access`; SimpleJWT com rotação + blacklist
   devolve também um novo `refresh`. O frontend foi corrigido para persistir o novo token. Sem esse
   ajuste, o segundo refresh falharia. A correção é mínima e documentada como bug real.
2. **Formato camelCase:** `djangorestframework-camel-case` converte o corpo e as respostas; os
   serializers declaram campos snake_case e o renderer entrega camelCase, mantendo o contrato sem
   alterar os componentes.
3. **Listas simples:** desativamos a paginação DRF porque o frontend consume arrays, conforme o mock.
4. **Erros:** um exception handler padroniza `{detail}` para 401/403/404 e preserva `{campo: [...]}`
   nas validações, que é o formato lido pelos formulários.
5. **Minimização:** o serializer de aluno omite `observacoes` para responsáveis, alinhado ao RNF-006.

Teste de fumaça `apps/usuarios/tests/test_smoke.py` percorre o fluxo completo com `APIClient`:
login do profissional → criação de plano → associação de atividade → login do aluno → listagem de
atividades → registro de histórico → análise da IA → aceite da recomendação → login do responsável
→ consulta do relatório. O teste passa junto com a suíte (86 testes, cobertura total de 89,8% com a configuração de omissão de migrations/seed/admin).

---

## Seção 18 — Dados

Alterações em relação ao SQL de novembro/2025:

| Alteração | Justificativa |
|---|---|
| `Aluno.responsavel` `NOT NULL` + `PROTECT` | RN-001, evitando aluno órfão e exclusão acidental do responsável |
| `HistoricoAtividade.resultado` numérico 0–100, `tentativas`, `tempo_resposta_seg`, `pediu_ajuda` | RF-004/RF-008; o SQL original tinha resultado textual |
| `RecomendacaoIA.nivel_atual`, `nivel_sugerido`, `fatores` JSON, `decidido_por`, `decidido_em` | RF-009, explicabilidade e RN-004 |
| `Mensagem.destinatario`, `lida` | RF-007; o SQL original não previa o destinatário |
| `Responsavel.consentimento_em` | LGPD: registro do consentimento |
| `ItemAtividade` (nova tabela) | `Atividade.itens` do contrato jogável, com ordem e integridade |
| `Usuario.is_active` e `tipo_usuario` | custom user + RF-010 |
| `Auditoria` (nova tabela) | rastreabilidade de login, decisões, planos e admin |
| `Contem`, `Utiliza`, `Sugere` explícitos | requisito de N:N com through |
| Índices em aluno, instituição, data_hora, status e FKs consultadas | desempenho de relatórios e escopo |
| `CheckConstraint` nível 1–5 e resultado 0–100 | integridade no banco, além da validação de API |

`Aluno.responsavel` continua apontando para `Responsavel` (PK = usuário). A instituição do aluno é
derivada de `Usuario.instituicao`; não há duplicação de coluna.

---

## Seção 20 — Arquitetura

A solução implementa as três camadas do SEPA:

1. **Apresentação:** SPA React/TypeScript, com Axios/React Query, consumindo a API por HTTP.
2. **Aplicação:** Django REST Framework, com JWT, RBAC, serviços de domínio, validações, auditoria
   e endpoints versionáveis; OpenAPI em `/api/schema/`.
3. **Dados:** PostgreSQL 16 em produção/Docker, com migrations versionadas, constraints e índices.

O frontend e o backend são containers independentes; o Docker Compose provê PostgreSQL com
healthcheck e a API com entrypoint que aplica migrations e collectstatic. A comunicação em
desenvolvimento usa proxy do Vite; em produção usa CORS restrito e HTTPS. O módulo de IA roda no
mesmo processo da API nesta fase (sem fila assíncrona), com artefato persistido em volume.

---

## Seção 21 — Tecnologias

| Tecnologia | Versão exata | Justificativa |
|---|---|---|
| Python | 3.12.10 | stack exigida e suporte das bibliotecas |
| Django | 5.2.18 | LTS 5.x, admin, ORM, migrations |
| Django REST Framework | 3.17.2 | ViewSets, serializers, permissões |
| simplejwt | 5.5.1 | JWT com rotação e blacklist |
| djangorestframework-camel-case | 1.4.2 | ponte camelCase ↔ snake_case |
| django-filter | 25.1 | filtros de catálogo/relatórios |
| django-cors-headers | 4.7.0 | CORS restrito ao frontend |
| drf-spectacular | 0.30.0 | OpenAPI/Swagger |
| psycopg | 3.2.9 | driver PostgreSQL 16 |
| django-environ | 0.12.0 | configuração por `.env` |
| bcrypt | 4.3.0 | `BCryptSHA256PasswordHasher` (RNF-002) |
| pandas / numpy | 2.3.3 / 2.3.3 | engenharia de features |
| scikit-learn | 1.7.2 | split, métricas, matriz de confusão |
| xgboost | 3.4.1 | classificador e `pred_contribs` |
| joblib | 1.5.1 | persistência do modelo |
| gunicorn | 23.0.0 | servidor WSGI |
| whitenoise | 6.11.0 | estáticos no container |
| pytest / pytest-django / pytest-cov | 9.0.3 / 4.11.1 / 7.0.0 | testes e cobertura |
| factory-boy | 3.3.3 | fábricas de teste |
| ruff | 0.14.0 | lint e format |
| pip-audit | 2.9.0 | auditoria de dependências |
| PostgreSQL | 16 | banco relacional |

Todas as versões estão fixadas em `requirements.txt`.

---

## Seção 14 — Requisitos Funcionais

| RF | Status | Endpoint(s) |
|---|---|---|
| RF-001 | Implementado | `/auth/login/`, `/auth/refresh/`, `/auth/register/`, `/me/` |
| RF-002 | Implementado | `/alunos/`, `/alunos/:id/`, `/planos/` e `/planos/:id/` |
| RF-003 | Implementado | `/planos/:id/atividades/`, `/atividades/` |
| RF-004 | Implementado | `/historico/` |
| RF-005 | Implementado | `/relatorios/desempenho/` |
| RF-006 | Implementado | `/alunos/`, `/relatorios/desempenho/` com escopo de responsável |
| RF-007 | Implementado | `/mensagens/`, `/mensagens/:id/lida/` |
| RF-008 | Implementado | `/aluno/atividades/`, `/historico/` |
| RF-009 | Implementado | `/recomendacoes/`, `.../aceitar/`, `.../rejeitar/`, `/ia/analisar/` |
| RF-010 | Implementado | `/admin/instituicoes/`, `/admin/profissionais/` |

Regras: RN-001 no banco/serializer/service, RN-002 via mixin de escopo, RN-003 no catálogo e
associação, RN-004 no serviço de decisão e na auditoria.

---

## Seção 23 — Organização do código e CI

```
sepa-backend/
├── config/
│   ├── settings/{base,dev,prod,test}.py
│   ├── urls.py, views.py (health), wsgi.py, asgi.py
├── apps/
│   ├── usuarios/{models,serializers,views,views_auth,services,urls,admin}.py
│   │   ├── management/commands/{seed_demo,treinar_modelo,gerar_recomendacoes}.py
│   │   └── tests/
│   ├── instituicoes/  atividades/  planos/  execucao/
│   ├── relatorios/    ia/          mensagens/
│   └── # cada app: models, serializers, views, urls, services, permissions, admin, tests
├── common/{permissions,mixins,exceptions,services,models,admin}.py
├── ml/                   # modelo e metadata gerados (fora do git)
├── docs/                 # contrato, decisões, relatório, evidências
├── Dockerfile, docker-compose.yml, entrypoint.sh
├── .github/workflows/ci.yml
├── pyproject.toml, requirements.txt, .env.example
└── README.md
```

Convenções: funções de domínio em `services.py`, views finas, type hints em serviços, permissões
centralizadas, migrations versionadas e testes por app.

Branches: `main` protegida + `develop` + `feature/*`; Conventional Commits
(`feat(planos)`, `test(permissoes)`, `docs`, `chore`); PR com ruff, pytest e build.

CI (`ci.yml`): Postgres 16 como serviço, instalação de `requirements.txt`, `ruff check`,
`ruff format --check`, `makemigrations --check`, `pytest --cov --cov-fail-under=80`,
`pip-audit` e `check --deploy`.

---

## Seção 25 — Segurança (rascunho antecipado)

- **Autenticação:** JWT Bearer; access de 15 minutos e refresh de 7 dias; rotação e blacklist de
  refresh; bcrypt como hasher principal; throttling de login e cadastro; logout com revogação.
- **Autorização:** RBAC por tipo de usuário; isolamento por instituição em todos os querysets;
  responsável vê só os próprios filhos; aluno só os próprios dados; 403 para acesso cruzado.
- **Minimização:** serializers por perfil; `observacoes` clínicas não vão para o responsável;
  aluno recebe apenas o necessário para executar atividades; nenhum identificador no treino de IA.
- **RNs:** RN-001 no banco e serviço; RN-002/003 no escopo; RN-004 com decisão explícita, registro
  de quem/quando e auditoria.
- **Mensagens:** somente profissionais e responsáveis com ao menos um aluno compartilhado; leitura
  só pelo destinatário.
- **Auditoria:** login (sucesso/falha), planos, decisões de IA, mensagens, cadastros/alterações de
  profissionais e status de assinatura, com IP e user-agent.
- **Produção:** `DEBUG=False`, `SECRET_KEY` obrigatória, HSTS, SSL redirect, cookies seguros,
  `SECURE_PROXY_SSL_HEADER`, `X_FRAME_OPTIONS=DENY`, CORS/CSRF por env, erros sem stack trace.
- **Dependências:** `pip-audit` sem vulnerabilidades conhecidas; `check --deploy` sem alertas
  relevantes e OpenAPI gerado sem erros/avisos.
