# SEPA Backend

API do **SEPA — Sistema Educacional Personalizado para Autistas**, implementada em Django 5 +
Django REST Framework sobre PostgreSQL. O frontend React (`../sepa-frontend`) consome exatamente
este contrato, com JWT, escopo por instituição e regras RN-001 a RN-004.

## Requisitos

- Python 3.12
- PostgreSQL 16 (produção/Docker) ou SQLite (apenas desenvolvimento/testes locais)
- Docker + Docker Compose (opcional)

## Subir com Docker (recomendado)

```bash
cd sepa-backend
cp .env.example .env      # no Windows: copy .env.example .env
# troque SECRET_KEY e senhas no .env
docker compose up --build
docker compose exec api python manage.py seed_demo --force
```

A API fica em `http://localhost:8000`:

- Healthcheck: `GET /api/health/`
- Swagger: `http://localhost:8000/api/docs/`
- OpenAPI: `http://localhost:8000/api/schema/`
- Admin Django: `http://localhost:8000/admin/`

O container aplica as migrations automaticamente no entrypoint. O seed não roda sozinho para
evitar sobrescrever dados; execute o comando explicitamente. O modelo de IA também pode ser treinado
manualmente:

```bash
docker compose exec api python manage.py treinar_modelo
```

## Rodar sem Docker

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo --force
python manage.py runserver
```

Sem `DATABASE_URL`, o settings `dev.py` usa SQLite em `db.sqlite3` para facilitar a avaliação local.
Para usar PostgreSQL local, preencha `DATABASE_URL` no `.env`:

```env
DATABASE_URL=postgres://sepa:sepa@localhost:5432/sepa
```

## Usuários de teste

Senha de todos: `Sepa@2026`. Dados fictícios.

| Perfil | E-mail |
|---|---|
| Administrador | `admin@sepa.exemplo` |
| Psicóloga (instituição A) | `ana.psicologa@sepa.exemplo` |
| Fonoaudiólogo (instituição A) | `bruno.fono@sepa.exemplo` |
| Pedagoga (instituição A) | `carla.pedagoga@sepa.exemplo` |
| Psicólogo (instituição B) | `diego.psicologo@sepa.exemplo` |
| Responsável (2 filhos) | `mariana.responsavel@sepa.exemplo` |
| Aluno | `lucas.aluno@sepa.exemplo` |
| Aluno (estagnação) | `helena.aluno@sepa.exemplo` |

## Comandos

| Comando | Descrição |
|---|---|
| `python manage.py migrate` | aplica migrations |
| `python manage.py seed_demo --force` | recria os dados de demonstração e treina o modelo se necessário |
| `python manage.py treinar_modelo` | treina o XGBoost com features anonimizadas e imprime métricas |
| `python manage.py gerar_recomendacoes` | gera análises/recomendações pendentes via IA |
| `pytest` | testes |
| `pytest --cov --cov-report=term-missing` | cobertura |
| `ruff check .` / `ruff format .` | qualidade |
| `pip-audit -r requirements.txt` | auditoria de dependências |

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `SECRET_KEY` | (obrigatória em prod) | assinatura de JWT/sessão |
| `DEBUG` | `false` | nunca ligar em produção |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | hosts permitidos |
| `DATABASE_URL` | SQLite no dev | PostgreSQL em prod |
| `CORS_ALLOWED_ORIGINS` | vazio | origem do frontend |
| `CSRF_TRUSTED_ORIGINS` | vazio | origens confiáveis |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | `15` / `7` | validade dos tokens |
| `SECURE_SSL_REDIRECT` | `true` no prod | HTTPS obrigatório |
| `ML_MODEL_PATH` | `ml/modelo_sepa.joblib` | artefato do modelo |
| `FRONTEND_URL` | `http://localhost:5173` | documentação/links |

## Integração com o frontend

1. No `sepa-frontend`, use `.env`:

```env
VITE_USE_MOCKS=false
VITE_API_URL=/api
```

2. O `vite.config.ts` já faz proxy de `/api` para `http://localhost:8000` em desenvolvimento.
   Em produção, configure `VITE_API_URL` com a URL pública da API e `CORS_ALLOWED_ORIGINS` no backend.
3. Rode `npm run dev` e faça login com uma conta do seed.
4. O frontend foi ajustado para persistir o **refresh token rotacionado** devolvido pelo backend,
   porque o mock antigo devolvia apenas `access`. O ajuste está documentado em
   `../sepa-frontend/docs/decisoes.md` e em `docs/decisoes.md`.

Fluxo de fumaça automatizado: `pytest apps/usuarios/tests/test_smoke.py -q`.

## Organização

```
config/            settings base/dev/prod/test, URLs, WSGI/ASGI
apps/
  usuarios/        custom user, perfis, auth, /me, alunos, responsáveis
  instituicoes/    instituições, cadastro público, administração
  atividades/      catálogo, conteúdos, itens jogáveis
  planos/          planos e associação de atividades
  execucao/        histórico de execução
  relatorios/      estatística e relatório de desempenho
  ia/              features, treino, análises e recomendações
  mensagens/       conversas profissional ↔ responsável
common/            permissões, mixins de escopo, exceções, auditoria
ml/                artefatos gerados (fora do git)
docs/              contrato, decisões, relatório e evidências
```

## Segurança e LGPD

- JWT com rotação/blacklist, access curto e refresh longo; bcrypt como hasher principal.
- RBAC por `tipo_usuario` + mixins de escopo por instituição; 403 para acesso cruzado.
- Serializers minimizam dados por perfil (responsável não recebe observações clínicas).
- Mensagens só entre profissional e responsável que compartilham aluno.
- Auditoria de login, decisões de IA, planos, mensagens e ações administrativas.
- Treino de IA somente com features numéricas, sem identificadores.
- Produção com HSTS, cookies seguros, SSL redirect, proxy header, `X_FRAME_OPTIONS=DENY`.

## Documentação

- [`docs/api-contract.md`](docs/api-contract.md) — contrato (cópia do frontend, referência da API).
- [`docs/decisoes.md`](docs/decisoes.md) — divergências, decisões e evolução do modelo.
- [`docs/relatorio-backend.md`](docs/relatorio-backend.md) — rascunhos para o documento.
- [`docs/evidencias/roteiro.md`](docs/evidencias/roteiro.md) — prints para a apresentação.

Consulte também o contrato detalhado do frontend em
`../sepa-frontend/docs/api-contract.md`.
