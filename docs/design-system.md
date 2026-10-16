# Design System — Segundo Cérebro

Fonte: Figma [Segundo Cérebro → Design System → Foundations](https://www.figma.com/design/fPdqla2Vm3DvuCRVCJb0tY/Segundo-C%C3%A9rebro?node-id=22-3).

Documento de referência para tokens e componentes base. Nomes de token em inglês (código); copy de UI em pt-BR.

## 1. Princípios

- Superfície clara (`bg-app`), conteúdo em cards brancos (`bg-card`).
- Contraste alto no texto principal (`ink` / `navy`); secundário em `muted`.
- Pastéis só para destaque de áreas/KPIs — não para texto longo.
- Componentes compactos: botões densos, tipografia pequena em listas.

## 2. Cores — surfaces

| Token | Hex | Uso |
| --- | --- | --- |
| `bg-app` | `#F4F6F8` | Fundo da aplicação |
| `bg-card` | `#FFFFFF` | Superfície de card / painel |
| `border` | `#E5E7EB` | Bordas e divisores |
| `ink` | `#1A1D26` | Texto e botão primary |
| `navy` | `#1D2535` | Ênfase escura (nav / headers) |
| `muted` | `#6B7280` | Caption, hint, texto secundário |

## 3. Cores — pastéis (KPIs / áreas)

| Token | Hex | Uso |
| --- | --- | --- |
| `sky` | `#EBF7FC` | KPI / área azul clara |
| `mint` | `#E8F8F0` | KPI / área verde |
| `peach` | `#FFF1E6` | KPI / área laranja |
| `lilac` | `#F3EEFF` | KPI / área lilás |
| `rose` | `#FFE8EC` | KPI / área rosa |

Sobre pastéis, rótulos usam tom saturado da mesma família (ex.: sky → texto azul), não `ink`.

## 4. Tipografia

| Papel | Spec | Token de cor |
| --- | --- | --- |
| Título de card | Bold, tamanho de destaque | `ink` |
| Corpo / lista | 13px Medium | `ink` |
| Caption | 11px | `muted` |
| Label de KPI | Uppercase pequeno | cor saturada da pastel |

UI copy permanece em pt-BR.

## 5. Componentes

### 5.1 Button (compact)

| Variante | Aparência |
| --- | --- |
| Primary | Fundo `ink` (ou `navy`), texto branco, cantos arredondados |
| Secondary | Fundo `bg-card`, borda `border`, texto `ink` |
| Pill / quick | Forma pill; fundo pastel (ex. `sky`) + texto saturado da família |

Estilo compacto: padding menor que botão “marketing”; adequado a listas e ações inline.

### 5.2 KPI tile

- Fundo: uma pastel (`sky`, `mint`, `peach`, `lilac`, `rose`).
- Estrutura:
  1. Label uppercase (ex.: `CHECK-IN`)
  2. Valor / título (ex.: `Ainda não`)
  3. Hint caption (ex.: `quando quiser`)
- Sem sombra pesada; cantos arredondados; sem overlay decorativo.

### 5.3 Card

- Fundo `bg-card`, borda `border`, cantos arredondados.
- Conteúdo típico: título bold → corpo/lista 13px Medium → caption 11px `muted`.
- Card só quando agrupa interação ou bloco de conteúdo; não usar card no hero.

## 6. Tokens CSS (aplicado)

Em `src/app/globals.css` (Tailwind v4 `@theme inline`):

| CSS var | Utilitário Tailwind |
| --- | --- |
| `--bg-app` | `bg-bg-app` |
| `--bg-card` | `bg-bg-card` |
| `--border` | `border-border` |
| `--ink` / `--navy` / `--muted` | `text-ink`, `bg-ink`, `bg-navy`, `text-muted` |
| `--pastel-*` | `bg-pastel-sky`, `bg-pastel-mint`, … |

Componentes compartilhados em `src/shared/ui/tokens.ts`: `primaryButton`, `secondaryButton`, `pillButton`, `card`, `textInput`, `eyebrow`, `caption`, `bodyText`.

## 7. Relação com o código atual

- Tokens Foundations ligados em `globals.css` + `shared/ui/tokens.ts`.
- Cores de pilar em `src/features/pillars/presentation/style.ts` usam paleta Tailwind (`blue`, `amber`, …) — conjunto de domínio, não os pastéis de KPI do Foundations.
- Shells `/app`, forms e neutro de pilar já usam tokens; paleta colorida de pilar (`blue`/`amber`/…) permanece domínio separado.

## 8. Fora de escopo (ainda)

- Dark mode alinhado aos tokens Foundations (Figma atual é light).
- Escala tipográfica completa (display, H1–H3).
- Spacing scale, radius scale, motion.
- Ícones (produto usa `lucide-react` nos pilares).
