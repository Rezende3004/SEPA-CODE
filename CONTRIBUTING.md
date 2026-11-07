# Como contribuir com o SEPA-CODE

Monorepo do SEPA com `sepa-frontend/` (React + TypeScript) e `sepa-backend/` (Django + DRF).

## Branches

| Branch | Uso |
| --- | --- |
| `main` | Versão estável e apresentável. Protegida: só recebe merge por Pull Request com o CI aprovado. |
| `develop` | Integração das entregas da fase. |
| `feature/<escopo>` | Uma branch por funcionalidade, criada a partir de `develop` (ex.: `feature/recomendacoes-ui`). |
| `fix/<escopo>` | Correções, a partir de `develop` (ou de `main`, se for urgente). |

Fluxo: `feature/*` → Pull Request para `develop` → Pull Request de `develop` para `main` ao fim da fase.

## Commits

Conventional Commits, no imperativo: `tipo(escopo): descrição`.
Tipos usados: `feat`, `fix`, `docs`, `test`, `chore`, `ci`, `refactor`.

## Pull Request

1. Crie a branch a partir de `develop` atualizada.
2. Rode as verificações localmente:
   - backend: `ruff check . && ruff format --check . && pytest`
   - frontend: `npm run lint && npm test && npm run build`
3. Abra o PR descrevendo os requisitos atendidos (RF/RNF), as evidências e as decisões tomadas.
4. Aguarde o CI (`.github/workflows/ci.yml`, jobs `backend` e `frontend`) e a revisão de um integrante.
5. Faça o merge mantendo a mensagem no padrão Conventional Commits.
