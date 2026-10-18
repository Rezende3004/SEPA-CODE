# Contrato da API — SEPA

Documento em construção por etapa. A versão completa é fechada na etapa 8 e serve de
especificação para o backend Django REST Framework.

## Convenções

- Base: `VITE_API_URL` (padrão `/api`).
- Todas as rotas terminam com barra (padrão DRF).
- Autenticação: `Authorization: Bearer <access>` em todas as rotas, exceto login,
  refresh, cadastro e listagem pública de instituições.
- Erros:
  - `401` → `{ "detail": "..." }`
  - `403` → `{ "detail": "..." }`
  - `400` → `{ "campo": ["mensagem"] }`
- Datas em ISO 8601. IDs numéricos.
- Access token expira em 120 s no mock; refresh em 8 h.

## Autenticação

### POST `/api/auth/login/`

```json
{ "email": "ana.psicologa@sepa.exemplo", "senha": "Sepa@2026" }
```

`200`:

```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "usuario": {
    "id": 2,
    "nome": "Ana Ribeiro",
    "email": "ana.psicologa@sepa.exemplo",
    "tipoUsuario": "PROFISSIONAL",
    "instituicaoId": 1,
    "instituicaoNome": "Instituto Horizonte Azul",
    "ativo": true,
    "especialidade": "PSICOLOGO",
    "registroProfissional": "CRP 06/12345"
  }
}
```

### POST `/api/auth/refresh/`

```json
{ "refresh": "<jwt>" }
```

`200`: `{ "access": "<jwt>" }` · `401` se inválido/expirado.

### POST `/api/auth/register/`

Campos comuns: `nome`, `email`, `senha`, `tipoUsuario` (`PROFISSIONAL` ou `RESPONSAVEL`),
`instituicaoId`.
`PROFISSIONAL`: `especialidade` (`PSICOLOGO` | `FONOAUDIOLOGO` | `PEDAGOGO`),
`registroProfissional`.
`RESPONSAVEL`: `telefone`.

`201` com o mesmo formato do login.

### GET `/api/me/`

`200`: `{ "usuario": { ... } }`.

### GET `/api/instituicoes/` (público)

`200`: `[{ "id": 1, "nomeFantasia": "Instituto Horizonte Azul" }]` — apenas assinaturas
`ATIVA`.
