# Roteiro de evidências — Backend SEPA

Capturas sugeridas para comprovar implementação, segurança e integração. Ordem recomendada.

| # | Print | Como capturar | O que deve aparecer |
|---|---|---|---|
| 01 | Swagger | `http://localhost:8000/api/docs/` | Endpoints agrupados, esquema JWT e modelos camelCase |
| 02 | OpenAPI JSON/YAML | `curl http://localhost:8000/api/schema/` | `openapi: 3.0.x` com paths e componentes |
| 03 | Containers | `docker compose ps` | `db` saudável e `api` em execução |
| 04 | Migrations | `docker compose exec api python manage.py showmigrations` | todas aplicadas |
| 05 | Seed | `docker compose exec -e DJANGO_SETTINGS_MODULE=config.settings.dev api python manage.py seed_demo --force` | usuários 1–16 e mensagem de sucesso; aborta em `DEBUG=False` |
| 06 | Treino do modelo | `python manage.py treinar_modelo` | features, acurácia, matriz de confusão e caminho do `.joblib` |
| 07 | Lint/format | `ruff check . && ruff format --check .` | sem erros |
| 08 | Testes | `pytest -q` | 97 testes passando |
| 09 | Cobertura | `pytest --cov --cov-report=term-missing` | total ≥ 80% (referência: ~90%), services/permissions cobertos |
| 10 | Testes PostgreSQL | `DATABASE_URL=postgres://... pytest -q` | 97 testes passando com PostgreSQL 16.10 (Docker indisponível no ambiente; compose usa Postgres 16) |
| 11 | Auditoria | `python manage.py shell -c "from common.models import Auditoria; print(Auditoria.objects.values('acao','usuario_id','criado_em')[:10])"` | login, decisões, planos, admin |
| 12 | Segurança | `pip-audit -r requirements.txt` | nenhuma vulnerabilidade conhecida |
| 13 | Check de deploy | `python manage.py check --deploy --settings=config.settings.prod` | sem alertas relevantes |
| 14 | Login real no frontend | `npm run dev` em `sepa-frontend` com `VITE_USE_MOCKS=false` | painel da Ana com dados do backend |
| 15 | 401/refresh | deixar access expirar e navegar | requisição renova e sessão continua; refresh antigo é rejeitado |
| 16 | Cadastro profissional pendente | cadastro de psicólogo no frontend | aviso “aguardando ativação”; login retorna 401; admin ativa |
| 17 | RN-001 | POST `/api/alunos/` sem `responsavelId` | 400 `responsavelId` |
| 18 | RN-002 | login Diego e tentar abrir aluno da instituição A | 403 `detail` |
| 19 | Admin institucional | login de admin com instituição e acesso a outra | apenas própria instituição; 403 no cruzado |
| 20 | RN-003 | profissional A tentar associar atividade da instituição B | 403 |
| 21 | RN-004 | abrir recomendação antes/depois do aceite | `Atividade.nivel_dificuldade` não muda; `nivelAtribuido` do plano muda |
| 22 | Aluno executa | login Lucas → atividades → concluir → histórico | POST 201 e item no relatório |
| 23 | Responsável | login Mariana → progresso | dados agregados, sem observações clínicas |
| 24 | Mensagens | profissional ↔ responsável com aluno compartilhado | envio 201; responsável sem vínculo recebe 403 |
| 25 | Admin | login admin → instituições/profissionais | status de assinatura e ativação de conta |
| 26 | Fluxo de fumaça | `pytest apps/usuarios/tests/test_smoke.py -q` | 2 testes passando |
| 27 | README | abrir `README.md` | instruções Docker/local, seed, modelo, env e Swagger |

## Dicas

- Rode o seed antes dos prints de frontend para garantir os IDs e as senhas do README.
- Para o print de treino, copie também `ml/modelo_sepa.json` (métricas e features).
- Guarde as imagens em `docs/evidencias/` com o número (`01-swagger.png`, ...).
- Não capture dados reais; todo o seed é fictício.
