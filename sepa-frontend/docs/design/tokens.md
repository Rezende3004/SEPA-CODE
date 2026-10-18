# Tokens de design

Fonte de verdade: `tailwind.config.ts` (cores, raios, sombras, tipografia) e
`src/shared/styles/tokens.css` (escala de fonte e alvo de toque).

## Identidade cromática

O SEPA usa **quatro cores**: azul, laranja, amarelo e branco. Os tons `soft` e `dark` são variações
dessas mesmas famílias, usadas para fundos e para garantir contraste de texto.

| Token            | Hex       | Uso                                 |
| ---------------- | --------- | ----------------------------------- |
| `canvas`         | `#FFFFFF` | fundo geral (branco)                |
| `surface`        | `#FFFFFF` | cartões e superfícies (branco)      |
| `ink`            | `#173042` | texto principal (azul escuro)       |
| `muted`          | `#4B6273` | texto secundário (azul acinzentado) |
| `line`           | `#D5E2EA` | bordas (azul claro)                 |
| `primary`        | `#1F5C8B` | ação principal, links (azul)        |
| `primary.dark`   | `#154466` | hover/ênfase                        |
| `primary.soft`   | `#E7F1F8` | fundos de destaque azuis            |
| `secondary`      | `#E07A2F` | apoio, gráficos (laranja)           |
| `secondary.dark` | `#A95312` | texto de alerta/exclusão (laranja)  |
| `secondary.soft` | `#FCEBDE` | fundos de destaque laranja          |
| `accent`         | `#F2C14E` | apoio gráfico (amarelo)             |
| `accent.dark`    | `#7A5A00` | texto de atenção (amarelo escuro)   |
| `accent.soft`    | `#FFF6D8` | fundos de destaque amarelos         |
| `success`        | `#1F5C8B` | acerto/evolução (azul)              |
| `warning`        | `#7A5A00` | estagnação/atenção (amarelo escuro) |
| `danger`         | `#A95312` | erro/exclusão (laranja escuro)      |
| `kid.canvas`     | `#FFFFFF` | fundo do aluno                      |
| `kid.primary`    | `#1F5C8B` | ação do aluno                       |
| `kid.accent`     | `#E07A2F` | destaque do aluno                   |

Contraste sobre branco: `ink` = 13,66:1; `primary` = 7,09:1; `danger` = 5,34:1;
`warning` = 6,38:1; `muted` = 6,38:1. Branco sobre `primary` = 7,09:1 e sobre `danger` = 5,34:1.
Todos atendem WCAG AA para texto normal.

O amarelo é usado como cor de apoio (barras, estrelas, badges e fundos suaves); para texto sobre
branco usa-se o `warning`/`accent.dark`, que é um amarelo escuro com contraste suficiente.

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
- Sobre fundo branco, cartões são separados por borda azul clara e sombra suave.

## Movimento

- Transições de 150–300 ms, apenas em mudanças de estado.
- Nada pisca, nada anima em loop, sem parallax.
- `prefers-reduced-motion` e a preferência do aluno desativam animações.

## Gráficos

- Resultado bruto: azul `#1F5C8B`.
- Média móvel: laranja `#E07A2F`.
- Tendência consolidada/EWMA: amarelo escuro `#B8860B`.

## Referência visual

- `docs/design/dashboard-referencia.png`: gráfico do protótipo Python, usado como
  referência para a curva de aprendizado (linha bruta, tendência suavizada e projeção).
- Não havia prints do Figma no repositório no momento da implementação.
