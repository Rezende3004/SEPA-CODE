# Tokens de design

Fonte de verdade: `tailwind.config.ts` (cores, raios, sombras, tipografia) e
`src/shared/styles/tokens.css` (escala de fonte e alvo de toque).

## Paleta

| Token          | Hex       | Uso                   |
| -------------- | --------- | --------------------- |
| `canvas`       | `#F7F5F0` | fundo geral (adultos) |
| `surface`      | `#FFFFFF` | cartões e superfícies |
| `ink`          | `#1F2D36` | texto principal       |
| `muted`        | `#566873` | texto secundário      |
| `line`         | `#DCE3E6` | bordas                |
| `primary`      | `#2A6F97` | ação principal, links |
| `primary.dark` | `#1F5675` | hover/ênfase          |
| `primary.soft` | `#E7F0F5` | fundos de destaque    |
| `secondary`    | `#F4A261` | apoio, gráficos       |
| `accent`       | `#E76F51` | atenção pontual       |
| `success`      | `#4F8A6D` | acerto/evolução       |
| `warning`      | `#A8641C` | estagnação/atenção    |
| `danger`       | `#B4483C` | erro/exclusão         |
| `kid.canvas`   | `#FBF8F3` | fundo do aluno        |
| `kid.primary`  | `#2F6F7E` | ação do aluno         |

Contraste: `ink` sobre `surface` = 14,6:1; `primary` sobre `surface` = 5,2:1;
branco sobre `primary` = 5,3:1. Todos atendem AA para texto normal.

## Tipografia

- Família: pilha de sistema (`system-ui`, Segoe UI, Roboto, Arial). Sem download externo,
  reduz latência e evita falha de fonte em escolas com rede restrita.
- Escala base de 16 px; títulos 20–30 px; corpo 14–16 px.
- Modos do aluno: normal (1.0), grande (1.12), muito grande (1.25), via
  `data-tamanho-fonte` no `html`.

## Espaçamento, raios e sombras

- Grade de 4 px (Tailwind).
- Alvo de toque mínimo: 48 px (`min-h-11`/`min-h-14`, botões grandes do aluno com 56 px).
- Raios: 8 px (controles), 12 px (botões), 16 px (cartões), 24 px (destaques).
- Sombras suaves: `shadow-card` e `shadow-soft`, sem elevação agressiva.

## Movimento

- Transições de 150–300 ms, apenas em mudanças de estado.
- Nada pisca, nada anima em loop, sem parallax.
- `prefers-reduced-motion` e a preferência do aluno desativam animações.

## Referência visual

- `docs/design/dashboard-referencia.png`: gráfico do protótipo Python, usado como
  referência para a curva de aprendizado (linha bruta, tendência suavizada e projeção).
- Não havia prints do Figma no repositório no momento da implementação.
