# Roteiro de evidências — Backend SEPA

Capturas sugeridas para comprovar implementação, segurança e integração. Ordem recomendada.

| # | Print | Como capturar | O que deve aparecer |
|---|---|---|---|
| 01 | Swagger | `http://localhost:8000/api/docs/` | Endpoints agrupados, esquema JWT e modelos camelCase |
| 02 | OpenAPI JSON/YAML | `curl http://localhost:8000/api/schema/` | `openapi: 3.0.x` com paths e componentes |
| 03 | Containers | `docker compose ps` | `db` saudável e `api` em execução |
| 04 | Migrations | `docker compose exec api python manage.py showmigrations` | todas aplicadas |
| 05 | Seed | `docker compose exec api python manage.py seed_demo --force` | usuários 1–16 e mensagem de sucesso |
| 06 | Treino do modelo | `python manage.py treinar_modelo` | features, acurácia, matriz de confusão e caminho do `.joblib` |
| 07 | Lint/format | `ruff check . && ruff format --check .` | sem erros |
| 08 | Testes | `pytest -q` | 86 testes passando |
| 09 | Cobertura | `pytest --cov --cov-report=term-missing` | total ≥ 80% (referência: 89,8%), services/permissions cobertos |
| 10 | Auditoria | `python manage.py shell -c "from common.models import Auditoria; print(Auditoria.objects.values('acao','usuario_id','criado_em')[:10])"` | login, decisões, planos, admin |
| 11 | Segurança | `pip-audit -r requirements.txt` | nenhuma vulnerabilidade conhecida |
| 12 | Check de deploy | `python manage.py check --deploy --settings=config.settings.prod` | apenas avisos de schema/OneToOne |
| 13 | Login real no frontend | `npm run dev` em `sepa-frontend` com `VITE_USE_MOCKS=false` | painel da Ana com dados do backend |
| 14 | 401/refresh | deixar access expirar e navegar | requisição renova e sessão continua; refresh antigo é rejeitado |
| 15 | RN-001 | POST `/api/alunos/` sem `responsavelId` | 400 `responsavelId` |
| 16 | RN-002 | login Diego e tentar abrir aluno da instituição A | 403 `detail` |
| 17 | RN-003 | profissional A tentar associar atividade da instituição B | 403 |
| 18 | RN-004 | abrir recomendação antes/depois do aceite | nível só muda após `aceitar/`, com auditoria |
| 19 | Aluno executa | login Lucas → atividades → concluir → histórico | POST 201 e item no relatório |
| 20 | Responsável | login Mariana → progresso | dados agregados, sem observações clínicas |
| 21 | Mensagens | profissional ↔ responsável com aluno compartilhado | envio 201; responsável sem vínculo recebe 403 |
| 22 | Admin | login admin → instituições/profissionais | status de assinatura e ativação de conta |
| 23 | Fluxo de fumaça | `pytest apps/usuarios/tests/test_smoke.py -q` | 2 testes passando |
| 24 | README | abrir `README.md` | instruções Docker/local, seed, modelo, env e Swagger |

## Dicas

- Rode o seed antes dos prints de frontend para garantir os IDs e as senhas do README.
- Para o print de treino, copie também `ml/modelo_sepa.json` (métricas e features).
- Guarde as imagens em `docs/evidencias/` com o número (`01-swagger.png`, ...).
- Não capture dados reais; todo o seed é fictício.
