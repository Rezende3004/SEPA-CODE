# Contrato da API — SEPA

Especificação consumida pelo frontend e implementada no mock (MSW). Serve como contrato para o
backend Django REST Framework do 6º período. Todas as rotas usam barra final (padrão DRF) e são
relativas a `VITE_API_URL` (padrão `/api`).

## Convenções

- **Autenticação:** `Authorization: Bearer <access>` em todas as rotas, exceto:
  - `POST /auth/login/`
  - `POST /auth/refresh/`
  - `POST /auth/register/`
  - `GET /instituicoes/`
- **Formato de erro:**
  - `400` → `{ "campo": ["mensagem"] }`
  - `401` → `{ "detail": "..." }`
  - `403` → `{ "detail": "..." }`
  - `404` → `{ "detail": "..." }`
  - `409` → `{ "detail": "..." }` (conflito de estado, ex.: recomendação já decidida)
- **Datas:** ISO 8601 (`2026-10-18T13:00:00.000Z`).
- **IDs:** numéricos, espelhando o schema PostgreSQL.
- **Administração:** `ADMINISTRADOR` com `instituicao` gerencia apenas a própria instituição;
  `is_superuser=True` representa o administrador global. Acesso cruzado → `403`.
- **Tokens (mock):** access com 120 s, refresh com 8 h. O frontend renova automaticamente no 401.
- **Paginação:** não há; o seed é pequeno. O backend pode paginar preservando a lista no campo
  `results`, desde que o frontend seja ajustado no `api.ts` da feature.

## Modelo de dados (resumo)

Tipos TypeScript em `src/shared/types/models.ts`. Entidades: `Instituicao`, `Usuario`,
`Profissional`, `Responsavel`, `Aluno`, `Atividade`, `ConteudoMultimidia`, `PlanoDeAtendimento`,
`HistoricoAtividade`, `Relatorio`, `AnaliseAprendizado`, `RecomendacaoIA`, `Mensagem`.

Extensões em relação ao schema original, necessárias para os requisitos:

| Campo/recurso                             | Justificativa                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Usuario.ativo`                           | RF-010 (ativar/desativar profissionais).                                                         |
| `Usuario.instituicaoId: number \| null`   | Administrador da plataforma não pertence a instituição.                                          |
| `Atividade.itens: ItemAtividade[]`        | Conteúdo jogável (emoji, rótulo, dica) para os motores de associação e sequência.                |
| `AtividadeAtribuida`                      | Resposta de `/aluno/atividades/` com `planoId`, `planoNome`, `nivelAtribuido`, `totalExecucoes`, `ultimaExecucao`. |
| `Contem.nivel_atribuido`                  | Nível efetivo da atividade em cada plano; aceite de recomendação atua só aqui, não no catálogo. |
| `AlunoResumo`                             | Resposta de `/alunos/` com responsável, instituição, média recente e tendência.                  |
| `RecomendacaoIA.nivelAtual` e `fatores[]` | Explicabilidade da IA (RF-009).                                                                  |
| `GET /responsaveis/`                      | Seleção de responsável no cadastro de aluno.                                                     |
| `GET /instituicoes/`                      | Seleção de instituição no cadastro público.                                                      |
| `GET /planos/:id/`                        | Abertura direta do plano.                                                                        |
| `POST /mensagens/:id/lida/`               | Marcação de leitura (RF-007).                                                                    |
| `GET /usuarios/:id/`                      | Nome do contato em conversa ainda sem mensagens.                                                 |
| `GET /admin/*`                            | Área do administrador (RF-010).                                                                  |

## Autenticação

### POST `/auth/login/`

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

Erros: `401` genérico para credenciais inválidas ou conta inativa; `403` assinatura da instituição suspensa.

### POST `/auth/refresh/`

```json
{ "refresh": "<jwt>" }
```

`200`: `{ "access": "<jwt>", "refresh": "<novo refresh>" }` quando a rotação está ativa. `401` se inválido/expirado ou já blacklistado. O frontend persiste o novo refresh, quando presente.

### POST `/auth/register/`

Campos comuns: `nome`, `email`, `senha` (mín. 8), `tipoUsuario` (`PROFISSIONAL` |
`RESPONSAVEL`), `instituicaoId`.

- `PROFISSIONAL`: `especialidade` (`PSICOLOGO` | `FONOAUDIOLOGO` | `PEDAGOGO`) e
  `registroProfissional`.
- `RESPONSAVEL`: `telefone`.

`201`:
- **RESPONSAVEL:** mesmo corpo do login (tokens + usuário) e sessão iniciada.
- **PROFISSIONAL:** `{ "usuario": {...}, "pendente": true, "detail": "..." }`, **sem tokens**. A conta é
  criada com `ativo=false` e só pode ser ativada por um administrador. Profissional inativo não
  autentica e tokens emitidos antes da desativação deixam de funcionar.

Erros: `400` por campo; instituição precisa estar `ATIVA`.

### GET `/me/`

`200`: `{ "usuario": { ...SessaoUsuario } }`.

## Instituições

### GET `/instituicoes/` (público)

`200`:

```json
[{ "id": 1, "nomeFantasia": "Instituto Horizonte Azul" }]
```

Somente assinaturas `ATIVA`.

## Alunos

### GET `/alunos/`

Escopo por perfil:

- `PROFISSIONAL`: alunos da própria instituição (RN-002).
- `RESPONSAVEL`: apenas filhos vinculados (`responsavelId`).
- `ALUNO`: apenas o próprio registro.
- `ADMINISTRADOR`: todos.

`200` — lista de `AlunoResumo`:

```json
[
  {
    "id": 11,
    "nome": "Lucas Costa",
    "email": "lucas.aluno@sepa.exemplo",
    "tipoUsuario": "ALUNO",
    "instituicaoId": 1,
    "ativo": true,
    "dataNascimento": "2017-03-12T15:00:00.000Z",
    "observacoes": "Gosta de animais...",
    "responsavelId": 6,
    "responsavelNome": "Mariana Costa",
    "responsavelEmail": "mariana.responsavel@sepa.exemplo",
    "instituicaoNome": "Instituto Horizonte Azul",
    "mediaRecente": 79.4,
    "tendencia": "EVOLUCAO",
    "totalPlanos": 1
  }
]
```

### GET `/alunos/:id/`

`200` com `AlunoResumo`. `403` se fora da instituição/escopo; `404` inexistente.

### POST `/alunos/`

Requer `PROFISSIONAL` (ou administrador).

```json
{
  "nome": "Novo Aluno",
  "email": "novo.aluno@sepa.exemplo",
  "dataNascimento": "2018-04-01",
  "observacoes": "Preferências e sensibilidades.",
  "responsavelId": 6
}
```

`201` com `AlunoResumo`; a conta do aluno é criada ativa com senha inicial `Sepa@2026`.
**RN-001:** sem `responsavelId` válido → `400` com `responsavelId`.

### GET `/responsaveis/` (extensão)

`PROFISSIONAL`/`ADMINISTRADOR`. Lista responsáveis da instituição:

```json
[{ "id": 6, "nome": "Mariana Costa", "email": "...", "telefone": "...", "instituicaoId": 1 }]
```

## Atividades

### GET `/atividades/`

Catálogo filtrado pela instituição da sessão (RN-003). Administrador institucional vê a própria
instituição; superusuário vê todas. Parâmetros opcionais: `busca`, `tipo`
(`ASSOCIACAO` | `SEQUENCIA`), `nivel` (1–5).

`200`:

```json
[
  {
    "id": 1,
    "titulo": "Quem é este animal?",
    "descricao": "Associe cada animal à palavra correta.",
    "nivelDificuldade": 1,
    "tipoAtividade": "ASSOCIACAO",
    "instituicaoId": 1,
    "conteudoIds": [1],
    "itens": [
      {
        "id": 100,
        "tipo": "EMOJI",
        "valor": "🐶",
        "rotulo": "Cachorro",
        "dica": "Ele late e abana o rabo."
      }
    ]
  }
]
```

### GET `/aluno/atividades/`

Requer `ALUNO`. Retorna as atividades dos planos do aluno autenticado, com metadados:

```json
[
  {
    "id": 1,
    "titulo": "Quem é este animal?",
    "planoId": 1,
    "planoNome": "Plano de comunicação e rotina — Lucas",
    "nivelAtribuido": 2,
    "nivelDificuldade": 2,
    "totalExecucoes": 16,
    "ultimaExecucao": "2026-10-17T13:00:00.000Z",
    "...": "demais campos de Atividade"
  }
]
```

`nivelAtribuido` é o nível efetivo do `Contem` para o plano do aluno; `nivelDificuldade` é
sobreposto por ele nesta resposta (o catálogo continua com o nível original).

## Histórico de execução

### POST `/historico/`

Requer `ALUNO`; o `alunoId` vem do token, nunca do corpo.

```json
{
  "atividadeId": 1,
  "resultado": 100,
  "tentativas": 4,
  "tempoRespostaSeg": 48,
  "feedback": "Excelente! Você acertou quase tudo. (Quem é este animal?)",
  "pediuAjuda": true
}
```

`201` com o registro criado. Validações: `resultado` 0–100, `tentativas` ≥ 1,
`tempoRespostaSeg` ≥ 0, atividade da instituição do aluno.

## Planos de atendimento

### GET `/planos/`

Escopo igual ao de alunos. Parâmetro opcional: `?aluno=:id`.

`200` — lista de `PlanoDetalhado` (inclui `alunoNome`, `profissionalNome`, `atividades`).

### GET `/planos/:id/`

`200` com `PlanoDetalhado`; `403` fora do escopo. Cada item de `atividades` inclui
`nivelAtribuido` (o nível do `Contem` naquele plano) e `nivelDificuldade` reflete esse valor.

### POST `/planos/`

Requer `PROFISSIONAL` da instituição do aluno.

```json
{
  "nomePlano": "Plano de comunicação",
  "dataInicio": "2026-10-01",
  "objetivos": "Ampliar vocabulário funcional e consolidar rotinas.",
  "alunoId": 11
}
```

`201` com o plano criado (inicia sem atividades).

### PATCH `/planos/:id/`

Aceita `nomePlano`, `dataInicio`, `objetivos`. `200` com `PlanoDetalhado`.

### DELETE `/planos/:id/`

`204`. Remove apenas o plano; as atividades do catálogo permanecem.

### POST `/planos/:id/atividades/`

```json
{ "atividadeId": 3 }
```

`200` com o plano atualizado. Atividade de outra instituição → `403` (RN-003).

### DELETE `/planos/:id/atividades/:atividadeId/`

`204`.

## Relatórios

### GET `/relatorios/desempenho/?aluno=:id&inicio=YYYY-MM-DD&fim=YYYY-MM-DD`

Perfis: `PROFISSIONAL` (instituição do aluno), `RESPONSAVEL` (filho vinculado),
`ADMINISTRADOR`. Datas opcionais (padrão: últimos 60 dias).

`200`:

```json
{
  "alunoId": 12,
  "alunoNome": "Helena Costa",
  "periodoInicio": "2026-08-19T03:00:00.000Z",
  "periodoFim": "2026-10-18T23:59:59.999Z",
  "resumo": {
    "mediaResultado": 49.5,
    "totalTentativas": 210,
    "totalExecucoes": 64,
    "pedidosAjuda": 34,
    "slope": 0.2,
    "tendencia": "ESTAGNACAO"
  },
  "porAtividade": [
    {
      "atividadeId": 1,
      "titulo": "Quem é este animal?",
      "nivelDificuldade": 1,
      "mediaResultado": 51.2,
      "totalExecucoes": 16,
      "tendencia": "ESTAGNACAO",
      "pontos": [
        {
          "data": "2026-08-20T13:00:00.000Z",
          "resultado": 48,
          "mediaMovel": 48,
          "ewma": 48
        }
      ]
    }
  ],
  "alertaEstagnacao": true,
  "observacoes": "A curva permanece estável no período..."
}
```

Cálculos (frontend mock e recomendações): média aritmética; média móvel progressiva de janela 3;
EWMA com `span=3` (equivalente ao protótipo `iasepa.py`); slope por regressão linear simples;
tendência: slope ≥ 1 → `EVOLUCAO`, ≤ −1 → `REGRESSAO`, caso contrário `ESTAGNACAO`.
`alertaEstagnacao` = tendência geral `ESTAGNACAO` e média < 65.

## Recomendações da IA

### GET `/recomendacoes/?aluno=:id&status=PENDENTE|ACEITA|REJEITADA`

`PROFISSIONAL` (instituição) ou `ADMINISTRADOR`. Ordenado por `dataGeracao` decrescente.

`200` — `RecomendacaoDetalhada[]`:

```json
[
  {
    "id": 1,
    "dataGeracao": "2026-10-17T11:30:00.000Z",
    "descricaoRecomendacao": "Helena mantém resultados estáveis...",
    "status": "PENDENTE",
    "analiseId": 2,
    "atividadeIds": [6, 9],
    "nivelSugerido": 2,
    "nivelAtual": 3,
    "fatores": [{ "metrica": "Média de resultados", "valor": 49, "peso": 0.34 }],
    "alunoId": 12,
    "alunoNome": "Helena Costa",
    "atividades": ["...Atividade"]
  }
]
```

### POST `/recomendacoes/:id/aceitar/`

**RN-004:** somente `PROFISSIONAL` da instituição do aluno. Aplica `nivelSugerido` (clamp 1–5) em
`Contem.nivel_atribuido` **apenas para os planos do aluno desta recomendação**. O catálogo
(`Atividade.nivel_dificuldade`) não é alterado. Marca `ACEITA`, grava `decidido_por`/`decidido_em` e
audita. Nenhuma alteração ocorre sem esta chamada explícita.
`200` com a recomendação atualizada; `403` perfil/instituição; `409` se já decidida.

### POST `/recomendacoes/:id/rejeitar/`

Marca `REJEITADA` sem alterar níveis. `200`; `403`; `409`.

## Mensagens

### GET `/mensagens/?com=:usuarioId`

Sem `com`, retorna todas as mensagens em que o usuário participa (ordem decrescente), usado para a
lista de conversas. Com `com`, retorna a conversa em ordem crescente.

`200` — `MensagemDetalhada[]`:

```json
[
  {
    "id": 1,
    "conteudoTexto": "Olá, Ana!",
    "dataEnvio": "2026-10-14T13:00:00.000Z",
    "remetenteId": 6,
    "destinatarioId": 2,
    "lida": true,
    "remetenteNome": "Mariana Costa",
    "destinatarioNome": "Ana Ribeiro"
  }
]
```

### POST `/mensagens/`

```json
{ "destinatarioId": 2, "conteudoTexto": "Bom dia!" }
```

`201` com `MensagemDetalhada`. `400` mensagem vazia; `403` destinatário de outra instituição.

### POST `/mensagens/:id/lida/` (extensão)

Somente o destinatário pode marcar. `200` com a mensagem; `403` caso contrário.

### GET `/usuarios/:id/` (extensão)

`200`: `{ "id": 2, "nome": "Ana Ribeiro", "tipoUsuario": "PROFISSIONAL", "instituicaoId": 1 }`.
Acesso apenas para a própria conta ou mesma instituição.

## Administração

Todas exigem `ADMINISTRADOR`; caso contrário `403`.

### GET `/admin/instituicoes/`

`200` — `Instituicao[]`.

### PATCH `/admin/instituicoes/:id/`

```json
{ "statusAssinatura": "ATIVA" }
```

Valores: `ATIVA`, `SUSPENSA`, `TESTE`. `200` com a instituição. Assinatura suspensa impede login e
novos cadastros da instituição.

### GET `/admin/profissionais/`

`200` — `ProfissionalAdmin[]` (inclui `instituicaoNome` e `ativo`).

### POST `/admin/profissionais/`

```json
{
  "nome": "Novo Profissional",
  "email": "novo.profissional@sepa.exemplo",
  "senha": "Senha@123",
  "especialidade": "PEDAGOGO",
  "registroProfissional": "MEC 000000",
  "instituicaoId": 1
}
```

`201` com `ProfissionalAdmin`. Validações de e-mail único, especialidade e instituição.

### PATCH `/admin/profissionais/:id/`

Aceita `ativo` (boolean), `nome` e `especialidade`. `200` com `ProfissionalAdmin`. Conta desativada
não consegue autenticar.

## Regras de negócio no “servidor”

| Regra                               | Onde é aplicada                                              |
| ----------------------------------- | ------------------------------------------------------------ |
| RN-001 — aluno exige responsável    | `POST /alunos/` → `400`; validação equivalente no formulário |
| RN-002 — isolamento por instituição | leitura/escrita de alunos e planos → `403`                   |
| RN-003 — atividades por instituição | catálogo, associação e histórico → filtro/`403`              |
| RN-004 - IA não altera sozinha      | apenas `aceitar/` de profissional aplica o nível em `Contem`, nos planos do aluno |

## Seed de demonstração

2 instituições, 4 profissionais (3 especialidades na instituição A e 1 na B), 5 responsáveis,
6 alunos, 15 atividades (níveis 1–5; associação e sequência; 10 na instituição A e 5 na B),
6 planos, ~300 registros de histórico em 8 semanas, 6 análises/recomendações e 10 mensagens.
Todos os usuários usam a senha `Sepa@2026` (dados fictícios).

Contas: `admin@sepa.exemplo`, `ana.psicologa@sepa.exemplo`, `bruno.fono@sepa.exemplo`,
`carla.pedagoga@sepa.exemplo`, `diego.psicologo@sepa.exemplo`,
`mariana.responsavel@sepa.exemplo`, `lucas.aluno@sepa.exemplo`,
`helena.aluno@sepa.exemplo`.

## Extensões implementadas no backend

- `POST /api/auth/logout/` — blacklist do refresh (`{ "refresh": "..." }` → `204`).
- `POST /api/ia/analisar/?aluno=:id` — gera `AnaliseAprendizado` e `RecomendacaoIA` (somente
  profissional da instituição). Resposta: `{ "analise": {...}, "recomendacao": {...} }`.
- `GET /api/health/` — healthcheck público para Docker/CI.
- `GET /api/schema/`, `GET /api/docs/`, `GET /api/redoc/` — OpenAPI e Swagger/Redoc.
- Refresh com rotação devolve `{ access, refresh }`; o frontend persiste o novo refresh.

Consulte `docs/decisoes.md` para as divergências entre contrato, handlers MSW e requisitos.

