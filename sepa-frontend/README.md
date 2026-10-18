# SEPA Frontend

Frontend do **SEPA — Sistema Educacional Personalizado para Autistas**, Projeto Integrador
(5º período, Fase 02). Aplicação React/TypeScript que consome a API RESTful por uma camada
simulada com MSW enquanto o backend Django REST Framework não existe.

## Requisitos

- Node.js 20+ (desenvolvido com Node 24)
- npm 10+

## Como rodar

```bash
cd sepa-frontend
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`. Com `VITE_USE_MOCKS=true`, o MSW intercepta as chamadas
Axios e serve os dados fictícios do seed.

## Usuários de teste

Senha de todos: `Sepa@2026`.

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

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | typecheck + build de produção |
| `npm run preview` | pré-visualização do build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (execução única) |
| `npm run test:watch` | Vitest em watch |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run format` | Prettier |

## Desligar os mocks

No `.env`:

```env
VITE_API_URL=https://api.sepa.exemplo/api
VITE_USE_MOCKS=false
```

Nenhum componente precisa ser alterado: os `features/*/api.ts` continuam usando a mesma
instância Axios e o mesmo contrato documentado em `docs/api-contract.md`.

## Estrutura

- `src/app`: bootstrap, providers, router, layouts e navegação.
- `src/features`: uma pasta por funcionalidade (`api.ts`, `hooks.ts`, `components/`,
  `pages/`, `schemas.ts`, testes).
- `src/shared`: tipos, UI, hooks, lib (Axios, estatística, formatação) e estilos.
- `src/mocks`: banco em memória, seed, handlers MSW do browser e dos testes.

Documentação complementar em `docs/`: contrato da API, decisões, relatório da fase e
roteiro de evidências.
